import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { setOption } from '@/services/settingService';
import { aria2TaskService } from '@/services/taskService';
import { useTaskStore } from '@/stores/taskStore';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import type { Aria2Task } from '@/types/aria2';
import { formatVolume } from '@/utils/format';
import TaskListPage from './TaskListPage';

vi.mock('@/services/taskService', () => ({
    aria2TaskService: {
        getTaskList: vi.fn(() => new Promise(() => undefined)),
        changeTaskPosition: vi.fn(),
        retryTask: vi.fn(),
        removeTasks: vi.fn(),
        clearStoppedTasks: vi.fn(),
        startTasks: vi.fn(),
        pauseTasks: vi.fn(),
    },
}));

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

function renderPage() {
    return renderWithPanelBars(
        <MemoryRouter initialEntries={['/tasks/downloading']}>
            <TaskListPage location="downloading" />
        </MemoryRouter>,
    );
}

function renderWaitingPage() {
    return renderWithPanelBars(
        <MemoryRouter initialEntries={['/tasks/waiting']}>
            <TaskListPage location="waiting" />
        </MemoryRouter>,
    );
}

afterEach(() => {
    useTaskStore.setState({ tasks: [], selected: {}, searchKeyword: '' });
    setOption('dragAndDropTasks', true);
});

describe('TaskListPage task card', () => {
    it('renders the task name as plain text', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderPage();

        expect(screen.getByText('ubuntu.iso').closest('a')).toBeNull();
    });

    it('provides a view detail link in the card', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderPage();

        expect(screen.getByLabelText('Click to view task detail').getAttribute('href')).toBe('/task/detail/gid123');
    });

    it('keeps the task unselected when clicking the view detail link', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderPage();

        fireEvent.click(screen.getByLabelText('Click to view task detail'));

        expect(useTaskStore.getState().selected['gid123']).toBeFalsy();
    });

    it('shows the status icon on the card', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderPage();

        const card = screen.getByText('ubuntu.iso').closest('div.cursor-pointer');
        const statusIcon = card?.querySelector('svg.lucide-download');

        expect(statusIcon).toBeTruthy();
        expect(card?.firstElementChild?.contains(statusIcon ?? null)).toBe(true);
    });

    it('gives the status icon a tinted background', () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'active' })] });

        renderPage();

        const card = screen.getByText('ubuntu.iso').closest('div.cursor-pointer');
        const icon = card?.querySelector('svg.lucide-download');

        expect(icon?.parentElement?.getAttribute('class')).toContain('bg-blue-500/15');
        expect(icon?.getAttribute('class')).toContain('text-blue-500');
    });

    it('shows the connection count in the status row', () => {
        useTaskStore.setState({ tasks: [createTask({ connections: 12 })] });

        renderPage();

        expect(screen.getByTitle('Connections').textContent).toContain('12');
    });

    it.each<Aria2Task['status']>(['complete', 'error', 'removed'])(
        'hides the connection count for %s tasks',
        (status) => {
            useTaskStore.setState({ tasks: [createTask({ status, connections: 12 })] });

            renderPage();

            expect(screen.queryByTitle('Connections')).toBeNull();
        },
    );

    it('shows the error description tooltip when hovering the status icon', () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'error', errorDescription: 'error.unknown' })] });

        renderPage();

        const statusIcon = document.querySelector('.card .rounded-lg.p-1') as Element;

        expect(statusIcon).toBeTruthy();
        expect(screen.queryByRole('tooltip')).toBeNull();

        fireEvent.mouseOver(statusIcon);

        expect(screen.getByRole('tooltip').textContent).toBeTruthy();

        fireEvent.mouseOut(statusIcon);

        expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('shows the error description tooltip on long press', async () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'error', errorDescription: 'error.unknown' })] });

        renderPage();

        const statusIcon = document.querySelector('.card .rounded-lg.p-1') as Element;

        fireEvent.touchStart(statusIcon);

        await waitFor(() => expect(screen.getByRole('tooltip')).toBeTruthy());

        fireEvent.touchEnd(statusIcon);

        expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('shows the share ratio instead of the remaining time for seeding tasks', () => {
        useTaskStore.setState({
            tasks: [createTask({ status: 'active', seeder: true, remainTime: 60, shareRatio: 0.375 })],
        });

        renderPage();

        expect(screen.queryByText('00:01:00')).toBeNull();
        expect(screen.getByText(/0\.375/)).toBeTruthy();
    });

    it('does not show the remaining time for stopped tasks', () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'complete', remainTime: 60 })] });

        renderPage();

        expect(screen.queryByText('00:01:00')).toBeNull();
    });

    it('still shows the remaining time for regular downloading tasks', () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'active', remainTime: 60 })] });

        renderPage();

        expect(screen.getByText('00:01:00')).toBeTruthy();
    });

    it('shows the retry button in place of the connection count for retryable tasks', () => {
        useTaskStore.setState({
            tasks: [createTask({ status: 'error', errorDescription: 'error.unknown', connections: 12 })],
        });

        renderPage();

        const retry = screen.getByLabelText('Retry');

        expect(screen.queryByTitle('Connections')).toBeNull();
        expect(retry.parentElement?.lastElementChild).toBe(retry);
        expect(retry.querySelector('svg.lucide-rotate-ccw')).toBeTruthy();
    });

    it('does not show the retry button for stopped tasks that are not retryable', () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'complete' })] });

        renderPage();

        expect(screen.queryByLabelText('Retry')).toBeNull();
    });

    it('retries the task when clicking the retry button on the card', async () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'error', errorDescription: 'error.unknown' })] });

        renderPage();

        fireEvent.click(screen.getByLabelText('Retry'));

        await waitFor(() => expect(aria2TaskService.retryTask).toHaveBeenCalledWith('gid123'));
    });

    it('renders the file count as a number with a file icon', () => {
        useTaskStore.setState({ tasks: [createTask({ files: [], selectedFileCount: 3 })] });

        renderPage();

        const fileCount = screen.getByTitle('(3 Files)');

        expect(fileCount.textContent).toBe('3');
        expect(fileCount.querySelector('svg.lucide-files')).toBeTruthy();
    });

    it('aligns the speed chips left and the connection count right', () => {
        useTaskStore.setState({ tasks: [createTask({ connections: 12 })] });

        renderPage();

        const connection = screen.getByTitle('Connections');
        const row = connection.parentElement;

        expect(row?.lastElementChild).toBe(connection);
        expect(row?.firstElementChild?.querySelector('.chip-download')).toBeTruthy();
    });

    it('renders the speed text without a background and with a fixed width', () => {
        const downloadText = formatVolume(999999999999) + '/s';
        const uploadText = formatVolume(1000) + '/s';
        useTaskStore.setState({ tasks: [createTask({ downloadSpeed: 999999999999, uploadSpeed: 1000 })] });

        renderPage();

        const download = screen.getByText(downloadText);
        const upload = screen.getByText(uploadText);

        expect(download.className).toContain('w-15');
        expect(upload.className).toContain('w-15');

        expect(download.parentElement?.className).toContain('chip-download');
        expect(download.parentElement?.className).toContain('bg-transparent');
        expect(download.parentElement?.className).toContain('pl-0');
        expect(upload.parentElement?.className).toContain('chip-upload');
        expect(upload.parentElement?.className).toContain('bg-transparent');
        expect(upload.parentElement?.className).toContain('pl-0');
    });

    it('toggles the selection when clicking the task name', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderPage();

        fireEvent.click(screen.getByText('ubuntu.iso'));

        expect(useTaskStore.getState().selected['gid123']).toBe(true);
    });

    it('selects the task card without a selection checkbox', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderPage();

        const card = screen.getByText('ubuntu.iso').closest('div.cursor-pointer');

        expect(card?.querySelector('input[type="checkbox"]')).toBeNull();

        fireEvent.click(card as HTMLElement);

        expect(useTaskStore.getState().selected['gid123']).toBe(true);
        expect(card?.className).toContain('card-selected');
    });

    it('colors the selected card with the task status color', () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'error' })] });

        renderPage();

        const card = screen.getByText('ubuntu.iso').closest('div.cursor-pointer') as HTMLElement;

        expect(card.style.getPropertyValue('--task-status-color')).toBe('var(--color-red-500)');

        fireEvent.click(card);

        expect(card.className).toContain('card-selected');
    });

    it.each<[Aria2Task['status'], string, string]>([
        ['active', 'bg-blue-500', 'text-blue-500'],
        ['complete', 'bg-green-600', 'text-green-600'],
        ['error', 'bg-red-500', 'text-red-500'],
    ])('colors the progress bar and percent text for %s tasks', (status, barClass, textClass) => {
        useTaskStore.setState({ tasks: [createTask({ status })] });

        renderPage();

        const card = screen.getByText('ubuntu.iso').closest('div.cursor-pointer');

        expect(card?.querySelector('.h-1 > div')?.className).toContain(barClass);
        expect(screen.getByText(/%$/).className).toContain(textClass);
    });

    it('uses the green progress for seeding tasks', () => {
        useTaskStore.setState({ tasks: [createTask({ status: 'active', seeder: true })] });

        renderPage();

        const card = screen.getByText('ubuntu.iso').closest('div.cursor-pointer');

        expect(card?.querySelector('.h-1 > div')?.className).toContain('bg-green-600');
        expect(screen.getByText(/%$/).className).toContain('text-green-600');
    });

    it('uses the soft status color style for the clear stopped tasks button', () => {
        renderWithPanelBars(
            <MemoryRouter initialEntries={['/tasks/stopped']}>
                <TaskListPage location="stopped" />
            </MemoryRouter>,
        );

        expect(screen.getByText('Clear Stopped Tasks').closest('button')?.className).toContain('btn-danger-soft');
    });

    it('renders evenly sized task list tabs with visible boundaries', () => {
        renderPage();

        const activeTab = screen.getByRole('link', { name: /Downloading/ });
        const inactiveTab = screen.getByRole('link', { name: /Finished/ });

        expect(activeTab.className).toContain('flex-1');
        expect(activeTab.className).toContain('text-primary');
        expect(inactiveTab.className).toContain('flex-1');
        expect(inactiveTab.className).toContain('border-black/5');
        expect(inactiveTab.className).toContain('bg-white/50');
    });
});

describe('TaskListPage drag handle', () => {
    it('renders a full-height drag handle with a large touch target', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderWaitingPage();

        const handle = screen.getByLabelText('Change Tasks Order by Drag-and-drop');
        const card = screen.getByText('ubuntu.iso').closest('div.cursor-pointer');

        expect(handle.className).toContain('w-11');
        expect(handle.className).toContain('-my-3');
        expect(handle.className).toContain('touch-none');
        expect(handle.className).toContain('cursor-grab');
        expect(card?.lastElementChild).toBe(handle);
        expect(handle.querySelector('svg.lucide-grip-vertical')).toBeTruthy();
    });

    it('does not render the drag handle outside the waiting list', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderPage();

        expect(screen.queryByLabelText('Change Tasks Order by Drag-and-drop')).toBeNull();
    });

    it('hides the drag handle when drag-and-drop is disabled', () => {
        useTaskStore.setState({ tasks: [createTask()] });
        setOption('dragAndDropTasks', false);

        renderWaitingPage();

        expect(screen.queryByLabelText('Change Tasks Order by Drag-and-drop')).toBeNull();
    });

    it('does not select the task when pressing the drag handle', () => {
        useTaskStore.setState({ tasks: [createTask()] });

        renderWaitingPage();

        fireEvent.click(screen.getByLabelText('Change Tasks Order by Drag-and-drop'));

        expect(useTaskStore.getState().selected['gid123']).toBeFalsy();
    });
});

describe('TaskListPage speed and connection visibility', () => {
    it.each<Aria2Task['status']>(['waiting', 'paused', 'complete', 'error', 'removed'])(
        'hides the speed chips for %s tasks',
        (status) => {
            useTaskStore.setState({ tasks: [createTask({ status })] });

            renderPage();

            expect(document.querySelector('.chip-download')).toBeNull();
            expect(document.querySelector('.chip-upload')).toBeNull();
        },
    );

    it.each<Aria2Task['status']>(['waiting', 'paused'])('hides the connection count for %s tasks', (status) => {
        useTaskStore.setState({ tasks: [createTask({ status, connections: 12 })] });

        renderPage();

        expect(screen.queryByTitle('Connections')).toBeNull();
    });

    it('shows the speed chips and connection count for active tasks', () => {
        useTaskStore.setState({ tasks: [createTask({ connections: 12 })] });

        renderPage();

        expect(document.querySelector('.chip-download')).toBeTruthy();
        expect(document.querySelector('.chip-upload')).toBeTruthy();
        expect(screen.getByTitle('Connections')).toBeTruthy();
    });
});
