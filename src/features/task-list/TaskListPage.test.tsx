import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
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

afterEach(() => {
    useTaskStore.setState({ tasks: [], selected: {}, searchKeyword: '' });
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

    it('shows the connection count in the status row', () => {
        useTaskStore.setState({ tasks: [createTask({ connections: 12 })] });

        renderPage();

        expect(screen.getByTitle('Connections').textContent).toContain('12');
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

        expect(download.className).toContain('w-22');
        expect(upload.className).toContain('w-22');

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

    it.each<[Aria2Task['status'], string, string]>([
        ['active', 'bg-primary', 'text-primary'],
        ['complete', 'bg-green-500', 'text-green-600'],
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

        expect(card?.querySelector('.h-1 > div')?.className).toContain('bg-green-500');
        expect(screen.getByText(/%$/).className).toContain('text-green-600');
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
