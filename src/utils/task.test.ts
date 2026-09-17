import { describe, expect, it } from 'vitest';
import type { Aria2Peer, Aria2Task } from '@/types/aria2';
import {
    estimateHealthPercentFromPeers,
    getCombinedPieces,
    getPieceStatus,
    getTaskStatusKey,
    isTaskRetryable,
    orderTasks,
    processBtPeers,
    processDownloadTask
} from './task';

function createTask(overrides: Partial<Aria2Task> = {}): Aria2Task {
    return {
        gid: 'g1',
        status: 'active',
        totalLength: '1000',
        completedLength: '250',
        downloadSpeed: '100',
        uploadSpeed: '0',
        bitfield: 'f0000000',
        numPieces: '4',
        ...overrides
    } as Aria2Task;
}

describe('processDownloadTask', () => {
    it('computes progress fields', () => {
        const task = processDownloadTask(createTask());

        expect(task.totalLength).toBe(1000);
        expect(task.completedLength).toBe(250);
        expect(task.completePercent).toBe(25);
        expect(task.remainLength).toBe(750);
        expect(task.remainPercent).toBe(75);
        expect(task.remainTime).toBe(7.5);
        expect(task.idle).toBe(false);
        expect(task.hasTaskName).toBe(false);
    });

    it('counts completed pieces', () => {
        const task = processDownloadTask(createTask());

        expect(task.completedPieces).toBe(4);
    });

    it('extracts task name from files', () => {
        const task = processDownloadTask(
            createTask({
                files: [
                    {
                        index: '1',
                        path: '/tmp/downloads/example.mp4',
                        length: '1000',
                        completedLength: '250',
                        selected: 'true'
                    }
                ]
            })
        );

        expect(task.taskName).toBe('example.mp4');
        expect(task.hasTaskName).toBe(true);
        expect(task.selectedFileCount).toBe(1);
    });
});

describe('getTaskStatusKey', () => {
    it('returns status keys', () => {
        expect(getTaskStatusKey(createTask({ status: 'active' }), true)).toBe('Downloading');
        expect(getTaskStatusKey(createTask({ status: 'waiting' }), true)).toBe('Waiting');
        expect(getTaskStatusKey(createTask({ status: 'paused' }), true)).toBe('Paused');
        expect(getTaskStatusKey(createTask({ status: 'complete' }), false)).toBe('Completed');
    });
});

describe('isTaskRetryable', () => {
    it('is only true for http errors with description', () => {
        expect(isTaskRetryable(createTask({ status: 'error', errorDescription: 'error.unknown' }))).toBe(true);
        expect(isTaskRetryable(createTask({ status: 'error', errorDescription: 'error.unknown', bittorrent: {} }))).toBe(false);
        expect(isTaskRetryable(createTask({ status: 'complete' }))).toBe(false);
    });
});

describe('orderTasks', () => {
    it('orders by total length', () => {
        const tasks = [createTask({ gid: 'a', totalLength: 300 }), createTask({ gid: 'b', totalLength: 100 })];
        const ordered = orderTasks(tasks as unknown as Record<string, unknown>[], 'size:asc') as unknown as Aria2Task[];

        expect(ordered.map((task) => task.gid)).toEqual(['b', 'a']);
    });
});

describe('getPieceStatus', () => {
    it('parses bitfield', () => {
        expect(getPieceStatus('f', 4)).toEqual([true, true, true, true]);
        expect(getPieceStatus('5', 4)).toEqual([false, true, false, true]);
    });
});

describe('getCombinedPieces', () => {
    it('merges consecutive pieces', () => {
        expect(getCombinedPieces('f', 4)).toEqual([{ isCompleted: true, count: 4 }]);
        expect(getCombinedPieces('5', 4)).toEqual([
            { isCompleted: false, count: 1 },
            { isCompleted: true, count: 1 },
            { isCompleted: false, count: 1 },
            { isCompleted: true, count: 1 }
        ]);
    });
});

describe('processBtPeers', () => {    it('swaps speeds and computes progress', () => {
        const task = createTask({ numPieces: '4', bitfield: '0', completePercent: 0 });
        const peers: Aria2Peer[] = [
            {
                ip: '127.0.0.1',
                port: '6881',
                bitfield: 'f',
                downloadSpeed: '10',
                uploadSpeed: '20'
            }
        ];

        processBtPeers(peers, task);

        expect(peers[0].name).toBe('127.0.0.1:6881');
        expect(peers[0].completePercent).toBe(100);
        expect(peers[0].downloadSpeed).toBe(20);
        expect(peers[0].uploadSpeed).toBe(10);
    });
});

describe('estimateHealthPercentFromPeers', () => {
    it('returns local progress when no peers', () => {
        const task = processDownloadTask(createTask());
        expect(estimateHealthPercentFromPeers(task, [])).toBe(task.completePercent);
    });

    it('estimates health from peer bitfields', () => {
        const task = createTask({ numPieces: '4', bitfield: '0', completePercent: 0 });
        const peers: Aria2Peer[] = [
            { ip: '1.1.1.1', port: '1', bitfield: 'f', downloadSpeed: '0', uploadSpeed: '0' }
        ];

        processBtPeers(peers, task);

        expect(estimateHealthPercentFromPeers(task, peers)).toBe(100);
    });
});

describe('processDownloadTask virtual file nodes', () => {
    it('builds a directory tree for multi-file torrents', () => {
        const task = processDownloadTask(
            createTask({
                dir: '/downloads',
                bittorrent: { mode: 'multi', info: { name: 'MyTorrent' } },
                files: [
                    { index: '1', path: '/downloads/MyTorrent/a/1.txt', length: '10', completedLength: '0', selected: 'true' },
                    { index: '2', path: '/downloads/MyTorrent/b/2.txt', length: '20', completedLength: '0', selected: 'true' }
                ]
            }),
            true
        );

        expect(task.multiDir).toBe(true);
        expect(task.files?.some((file) => file.isDir)).toBe(true);
        expect(task.files?.filter((file) => !file.isDir)).toHaveLength(2);
    });
});
