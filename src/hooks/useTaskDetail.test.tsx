import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTaskDetailStore } from '@/stores/taskDetailStore';
import { useTaskDetail } from './useTaskDetail';

const mocks = vi.hoisted(() => ({
    getTaskStatus: vi.fn(),
    getBtTaskPeers: vi.fn(),
}));

vi.mock('@/services/taskService', () => ({
    aria2TaskService: {
        getTaskStatus: mocks.getTaskStatus,
        getBtTaskPeers: mocks.getBtTaskPeers,
    },
}));

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
});
