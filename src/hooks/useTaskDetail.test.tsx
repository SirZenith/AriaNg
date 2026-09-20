import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTaskDetailStore } from '@/stores/taskDetailStore';
import { useTaskDetail } from './useTaskDetail';

const mocks = vi.hoisted(() => ({
    getTaskStatus: vi.fn(),
    getTaskStatusAndBtPeers: vi.fn(),
    getBtTaskPeers: vi.fn(),
}));

vi.mock('@/services/taskService', () => ({
    aria2TaskService: {
        getTaskStatus: mocks.getTaskStatus,
        getTaskStatusAndBtPeers: mocks.getTaskStatusAndBtPeers,
        getBtTaskPeers: mocks.getBtTaskPeers,
    },
}));

vi.mock('@/services/settingService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/services/settingService')>();

    return {
        ...actual,
        getDownloadTaskRefreshInterval: () => 50,
    };
});

beforeEach(() => {
    mocks.getTaskStatusAndBtPeers.mockResolvedValue({ success: true });
});

afterEach(() => {
    vi.clearAllMocks();
    useTaskDetailStore.setState({ gid: null, taskName: '' });
});

describe('useTaskDetail', () => {
    it('records the task name of the viewed task for the toolbar', async () => {
        mocks.getTaskStatus.mockResolvedValue({
            success: true,
            data: { gid: 'gid123', taskName: 'ubuntu.iso' },
        });

        renderHook(() => useTaskDetail('gid123'));

        await waitFor(() => {
            expect(useTaskDetailStore.getState()).toMatchObject({ gid: 'gid123', taskName: 'ubuntu.iso' });
        });
    });

    it('applies the refreshed task and peers from polling', async () => {
        mocks.getTaskStatus.mockResolvedValue({
            success: true,
            data: { gid: 'gid123', taskName: 'ubuntu.iso', status: 'active', completedLength: '100' },
        });
        mocks.getTaskStatusAndBtPeers.mockResolvedValue({
            success: true,
            task: { gid: 'gid123', taskName: 'ubuntu.iso', status: 'active', completedLength: '900' },
            peers: [{ peerId: 'peer-1' }],
        });

        const { result } = renderHook(() => useTaskDetail('gid123'));

        await waitFor(() => {
            expect(result.current.task?.completedLength).toBe('900');
        });

        expect(result.current.peers).toHaveLength(1);
    });
});
