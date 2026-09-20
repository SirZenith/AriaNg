import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aria2TaskService } from '@/services/taskService';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import type { Aria2File, Aria2Task } from '@/types/aria2';
import TaskFileList from './TaskFileList';

vi.mock('@/services/taskService', () => ({
    aria2TaskService: {
        selectTaskFile: vi.fn(),
    },
}));

function createTask(overrides: Partial<Aria2Task> = {}): Aria2Task {
    return {
        gid: 'gid',
        status: 'active',
        totalLength: '0',
        completedLength: '0',
        downloadSpeed: '0',
        uploadSpeed: '0',
        multiDir: true,
        numPieces: '0',
        bitfield: '',
        files: [
            { isDir: true, nodePath: 'Media', nodeName: 'Media', level: 1, relativePath: '' },
            {
                isDir: false,
                index: '1',
                relativePath: 'Media',
                fileName: 'movie.mkv',
                level: 2,
                length: '100',
                completePercent: 50,
                selected: true,
            },
            { isDir: true, nodePath: 'Docs', nodeName: 'Docs', level: 1, relativePath: '' },
            {
                isDir: false,
                index: '2',
                relativePath: 'Docs',
                fileName: 'manual.pdf',
                level: 2,
                length: '100',
                completePercent: 0,
                selected: false,
            },
        ] as unknown as Aria2File[],
        ...overrides,
    };
}

describe('TaskFileList', () => {
    it('collapses all directories by default', () => {
        renderWithPanelBars(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.getByText('Media')).toBeTruthy();
        expect(screen.getByText('Docs')).toBeTruthy();
        expect(screen.queryByText('movie.mkv')).toBeNull();
        expect(screen.queryByText('manual.pdf')).toBeNull();
    });

    it('renders the folder toggle button only for directories', () => {
        renderWithPanelBars(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.getAllByLabelText(/^(Expand|Collapse)$/)).toHaveLength(2);

        fireEvent.click(screen.getByText('Expand All'));

        const fileRow = screen.getByText('movie.mkv').closest('div');
        expect(fileRow?.querySelector('button')).toBeNull();
    });

    it('does not render a progress bar for directories and widens the name column', () => {
        renderWithPanelBars(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        const dirName = screen.getByText('Media').closest('div');
        expect(dirName?.className).toContain('sm:col-span-9');

        const dirRow = screen.getByText('Media').closest('div[class*="grid-cols-12"]');
        expect(dirRow?.textContent).not.toContain('%');

        fireEvent.click(screen.getByText('Expand All'));

        const fileRow = screen.getByText('movie.mkv').closest('div[class*="grid-cols-12"]');
        expect(fileRow?.textContent).toContain('50.00%');
    });

    it('expands and collapses all directories', () => {
        renderWithPanelBars(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.queryByText('movie.mkv')).toBeNull();

        fireEvent.click(screen.getByText('Expand All'));

        expect(screen.getByText('movie.mkv')).toBeTruthy();
        expect(screen.getByText('manual.pdf')).toBeTruthy();

        fireEvent.click(screen.getByText('Collapse All'));

        expect(screen.queryByText('movie.mkv')).toBeNull();
        expect(screen.queryByText('manual.pdf')).toBeNull();
    });

    it('toggles the directory when clicking anywhere on the row', () => {
        renderWithPanelBars(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.queryByText('movie.mkv')).toBeNull();

        fireEvent.click(screen.getByText('Media'));

        expect(screen.getByText('movie.mkv')).toBeTruthy();
        expect(screen.queryByText('manual.pdf')).toBeNull();

        fireEvent.click(screen.getByText('Media'));

        expect(screen.queryByText('movie.mkv')).toBeNull();
    });

    it('toggles the directory when clicking the row while choosing files', () => {
        renderWithPanelBars(<TaskFileList task={createTask({ status: 'waiting' })} onChanged={vi.fn()} />);

        fireEvent.click(screen.getByText('(Choose Files)'));

        fireEvent.click(screen.getByText('Media'));

        expect(screen.getByText('movie.mkv')).toBeTruthy();

        fireEvent.click(screen.getByText('Media'));

        expect(screen.queryByText('movie.mkv')).toBeNull();
    });

    it('does not toggle the directory when clicking its checkbox while choosing files', () => {
        renderWithPanelBars(<TaskFileList task={createTask({ status: 'waiting' })} onChanged={vi.fn()} />);

        fireEvent.click(screen.getByText('(Choose Files)'));

        const dirRow = screen.getByText('Media').closest('div[class*="grid-cols-12"]');
        const checkbox = dirRow?.querySelector('input[type="checkbox"]');

        expect(checkbox).toBeTruthy();

        fireEvent.click(checkbox as HTMLInputElement);

        expect(screen.queryByText('movie.mkv')).toBeNull();
    });

    it('indents nested files by one level and leaves top level entries unindented', () => {
        renderWithPanelBars(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        const dirContent = screen.getByText('Media').closest('div[class*="grid-cols-12"]')?.firstElementChild;
        expect((dirContent as HTMLElement).style.paddingLeft).toBe('0px');

        fireEvent.click(screen.getByText('Expand All'));

        const fileContent = screen.getByText('movie.mkv').closest('div[class*="grid-cols-12"]')?.firstElementChild;
        expect((fileContent as HTMLElement).style.paddingLeft).toBe('16px');
    });

    it('inverts the selection while choosing files', () => {
        renderWithPanelBars(<TaskFileList task={createTask({ status: 'waiting' })} onChanged={vi.fn()} />);

        fireEvent.click(screen.getByText('(Choose Files)'));

        expect(screen.getByText('1 / 2')).toBeTruthy();

        fireEvent.click(screen.getByText('Select Invert'));

        expect(screen.getByText('1 / 2')).toBeTruthy();

        const dirRow = screen.getByText('Media').closest('div[class*="grid-cols-12"]');
        const mediaCheckbox = dirRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;

        expect(mediaCheckbox.checked).toBe(false);
    });

    it('disables save until a file is selected and saves the selection', async () => {
        const selectTaskFile = vi.mocked(aria2TaskService.selectTaskFile);
        const onChanged = vi.fn();

        renderWithPanelBars(<TaskFileList task={createTask({ status: 'waiting' })} onChanged={onChanged} />);

        fireEvent.click(screen.getByText('(Choose Files)'));
        fireEvent.click(screen.getByText('Select None'));

        expect(screen.getByText('0 / 2')).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);

        fireEvent.click(screen.getByText('Select All'));

        expect(screen.getByText('2 / 2')).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(false);

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => {
            expect(selectTaskFile).toHaveBeenCalledWith('gid', ['1', '2']);
        });

        expect(onChanged).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Select Invert')).toBeNull();
    });

    it('collapses the filter section until it is toggled', () => {
        renderWithPanelBars(<TaskFileList task={createTask({ status: 'waiting' })} onChanged={vi.fn()} />);

        fireEvent.click(screen.getByText('(Choose Files)'));

        const filterButton = screen.getByRole('button', { name: 'Filter' });
        const filterGroup = filterButton.nextElementSibling as HTMLElement;

        expect(filterGroup.className).toContain('hidden');

        fireEvent.click(filterButton);

        expect(filterGroup.className).not.toContain('hidden');
        expect(filterGroup.className).toContain('flex');
    });

    it('renders the selection toolbar into the top bar slot', () => {
        renderWithPanelBars(<TaskFileList task={createTask({ status: 'waiting' })} onChanged={vi.fn()} />);

        fireEvent.click(screen.getByText('(Choose Files)'));

        const selectAllButton = screen.getByRole('button', { name: 'Select All' });

        expect(selectAllButton.closest('.bg-page')).not.toBeNull();
    });
});
