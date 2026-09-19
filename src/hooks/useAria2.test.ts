import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTaskListPolling } from './useAria2';
import { aria2TaskService } from '@/services/taskService';
import { useTaskStore } from '@/stores/taskStore';
import type { Aria2Task } from '@/types/aria2';

vi.mock('@/services/taskService', () => ({
    aria2TaskService: {
        getTaskList: vi.fn(),
    },
}));

vi.mock('@/services/settingService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/services/settingService')>();

    return {
        ...actual,
        getDownloadTaskRefreshInterval: () => 50,
    };
});

function makeFullTask(gid: string, name: string): Aria2Task {
    return {
        gid,
        status: 'active',
        bittorrent: { info: { name } },
        files: [{ index: '1', path: '/downloads/' + name, selected: 'true', length: '100', completedLength: '50' }],
    } as unknown as Aria2Task;
}

function toBasicTask(task: Aria2Task): Aria2Task {
    const copy = { ...task } as Record<string, unknown>;

    delete copy.bittorrent;
    delete copy.files;

    return copy as unknown as Aria2Task;
}

describe('useTaskListPolling', () => {
    afterEach(() => {
        vi.clearAllMocks();
        useTaskStore.setState({ tasks: [], pollingPaused: false });
    });

    it('re-requests full task info when the task list changes', async () => {
        let currentTasks = [makeFullTask('a', 'file-a'), makeFullTask('b', 'file-b')];

        vi.mocked(aria2TaskService.getTaskList).mockImplementation(async (_type, full) => ({
            success: true,
            data: (full ? currentTasks : currentTasks.map(toBasicTask)) as Aria2Task[],
        }));

        const { unmount } = renderHook(() => useTaskListPolling('downloading'));

        await waitFor(() => {
            expect(useTaskStore.getState().tasks).toHaveLength(2);
        });

        expect(useTaskStore.getState().tasks.map((task) => task.taskName)).toEqual(['file-a', 'file-b']);

        currentTasks = [makeFullTask('a', 'file-a')];

        await waitFor(() => {
            expect(useTaskStore.getState().tasks).toHaveLength(1);
        });

        expect(useTaskStore.getState().tasks[0].taskName).toBe('file-a');

        const fullCalls = vi.mocked(aria2TaskService.getTaskList).mock.calls.filter((call) => call[1] === true);

        expect(fullCalls.length).toBeGreaterThanOrEqual(2);

        unmount();
    });
});
