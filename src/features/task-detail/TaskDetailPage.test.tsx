import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { aria2TaskService } from '@/services/taskService';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import type { Aria2Task } from '@/types/aria2';
import { copyText } from '@/utils/clipboard';
import TaskDetailPage from './TaskDetailPage';

vi.mock('@/hooks/useTaskDetail', () => ({
    useTaskDetail: vi.fn(),
}));

vi.mock('@/services/taskService', () => ({
    aria2TaskService: {
        startTasks: vi.fn(),
        pauseTasks: vi.fn(),
        retryTask: vi.fn(),
        removeTasks: vi.fn(),
        selectTaskFile: vi.fn(),
    },
}));

vi.mock('@/services/notification', () => ({
    notifyInPage: vi.fn(),
}));

vi.mock('@/utils/clipboard', () => ({
    copyText: vi.fn(async () => true),
}));

vi.mock('@/services/settingService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/services/settingService')>();

    return {
        ...actual,
        getAfterRetryingTask: vi.fn(() => 'no-action'),
        getConfirmTaskRemoval: vi.fn(() => true),
        getShowPiecesInfoInTaskDetailPage: vi.fn(() => 'never'),
    };
});

function createTask(overrides: Partial<Aria2Task> = {}): Aria2Task {
    return {
        gid: 'gid123',
        status: 'active',
        taskName: 'ubuntu.iso',
        totalLength: 1000,
        completedLength: 500,
        completePercent: 50,
        downloadSpeed: 0,
        uploadSpeed: 0,
        numPieces: 0,
        bitfield: '',
        files: [],
        connections: 0,
        remainTime: -1,
        ...overrides,
    } as unknown as Aria2Task;
}

const useTaskDetailMock = vi.mocked(useTaskDetail);

function renderPage() {
    return renderWithPanelBars(
        <MemoryRouter initialEntries={['/task/detail/gid123']}>
            <Routes>
                <Route path="/task/detail/:gid" element={<TaskDetailPage />} />
            </Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    vi.mocked(aria2TaskService.retryTask).mockResolvedValue({ success: true });
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('TaskDetailPage bottom bar', () => {
    it('pauses an active task', () => {
        useTaskDetailMock.mockReturnValue({ task: createTask({ status: 'active' }), peers: [], loading: false });

        renderPage();

        fireEvent.click(screen.getByText('Pause'));

        expect(aria2TaskService.pauseTasks).toHaveBeenCalledWith(['gid123']);
    });

    it('starts a paused task', () => {
        useTaskDetailMock.mockReturnValue({ task: createTask({ status: 'paused' }), peers: [], loading: false });

        renderPage();

        fireEvent.click(screen.getByText('Start'));

        expect(aria2TaskService.startTasks).toHaveBeenCalledWith(['gid123']);
    });

    it('retries a retryable errored task', () => {
        useTaskDetailMock.mockReturnValue({
            task: createTask({ status: 'error', errorDescription: 'errorCode=1' }),
            peers: [],
            loading: false,
        });

        renderPage();

        fireEvent.click(screen.getByText('Retry'));

        expect(aria2TaskService.retryTask).toHaveBeenCalledWith('gid123');
    });

    it('removes the task after confirmation', () => {
        useTaskDetailMock.mockReturnValue({ task: createTask({ status: 'active' }), peers: [], loading: false });
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderPage();

        fireEvent.click(screen.getByText('Delete'));

        expect(confirmSpy).toHaveBeenCalled();
        expect(aria2TaskService.removeTasks).toHaveBeenCalledWith([expect.objectContaining({ gid: 'gid123' })]);

        confirmSpy.mockRestore();
    });

    it('copies the task download url', async () => {
        useTaskDetailMock.mockReturnValue({
            task: createTask({ status: 'active', singleUrl: 'https://example.com/a.iso' }),
            peers: [],
            loading: false,
        });

        renderPage();

        fireEvent.click(screen.getByText('Copy Download Url'));

        await waitFor(() => {
            expect(copyText).toHaveBeenCalledWith('https://example.com/a.iso');
        });
    });

    it('switches the bottom bar to file choosing actions', () => {
        useTaskDetailMock.mockReturnValue({
            task: createTask({
                status: 'paused',
                files: [
                    {
                        index: '1',
                        isDir: false,
                        fileName: 'a.mkv',
                        path: '/a.mkv',
                        length: '1',
                        completedLength: '0',
                        completePercent: 0,
                        selected: 'true',
                    },
                    {
                        index: '2',
                        isDir: false,
                        fileName: 'b.mkv',
                        path: '/b.mkv',
                        length: '1',
                        completedLength: '0',
                        completePercent: 0,
                        selected: 'false',
                    },
                ] as unknown as Aria2Task['files'],
            }),
            peers: [],
            loading: false,
        });

        renderPage();

        fireEvent.click(screen.getByText('Files'));

        expect(screen.getByText('Overview')).toBeTruthy();

        fireEvent.click(screen.getByText('(Choose Files)'));

        expect(screen.queryByText('Overview')).toBeNull();
        expect(screen.queryByText('Files')).toBeNull();
        expect(screen.getByRole('button', { name: 'Select All' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.getByText('Files')).toBeTruthy();
        expect(screen.getByText('Overview')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Select All' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy();
    });
});
