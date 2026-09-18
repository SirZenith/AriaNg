import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Aria2File, Aria2Task } from '@/types/aria2';
import TaskFileList from './TaskFileList';

function createTask(): Aria2Task {
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
            { isDir: true, nodePath: 'Media', nodeName: 'Media', level: 0, relativePath: '' },
            {
                isDir: false,
                index: '1',
                relativePath: 'Media',
                fileName: 'movie.mkv',
                level: 1,
                length: '100',
                completePercent: 50,
                selected: true,
            },
            { isDir: true, nodePath: 'Docs', nodeName: 'Docs', level: 0, relativePath: '' },
            {
                isDir: false,
                index: '2',
                relativePath: 'Docs',
                fileName: 'manual.pdf',
                level: 1,
                length: '100',
                completePercent: 0,
                selected: false,
            },
        ] as unknown as Aria2File[],
    };
}

describe('TaskFileList', () => {
    it('collapses all directories by default', () => {
        render(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.getByText('Media')).toBeTruthy();
        expect(screen.getByText('Docs')).toBeTruthy();
        expect(screen.queryByText('movie.mkv')).toBeNull();
        expect(screen.queryByText('manual.pdf')).toBeNull();
    });

    it('renders the folder toggle button only for directories', () => {
        render(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.getAllByLabelText(/Expand|Collapse/)).toHaveLength(2);

        fireEvent.click(screen.getByText('Expand All'));

        const fileRow = screen.getByText('movie.mkv').closest('div');
        expect(fileRow?.querySelector('button')).toBeNull();
    });

    it('does not render a progress bar for directories and widens the name column', () => {
        render(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        const dirName = screen.getByText('Media').closest('div');
        expect(dirName?.className).toContain('sm:col-span-9');

        const dirRow = screen.getByText('Media').closest('div[class*="grid-cols-12"]');
        expect(dirRow?.textContent).not.toContain('%');

        fireEvent.click(screen.getByText('Expand All'));

        const fileRow = screen.getByText('movie.mkv').closest('div[class*="grid-cols-12"]');
        expect(fileRow?.textContent).toContain('50.00%');
    });

    it('expands and collapses all directories', () => {
        render(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.queryByText('movie.mkv')).toBeNull();

        fireEvent.click(screen.getByText('Expand All'));

        expect(screen.getByText('movie.mkv')).toBeTruthy();
        expect(screen.getByText('manual.pdf')).toBeTruthy();

        fireEvent.click(screen.getByText('Collapse All'));

        expect(screen.queryByText('movie.mkv')).toBeNull();
        expect(screen.queryByText('manual.pdf')).toBeNull();
    });

    it('toggles the directory when clicking anywhere on the row', () => {
        render(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.queryByText('movie.mkv')).toBeNull();

        fireEvent.click(screen.getByText('Media'));

        expect(screen.getByText('movie.mkv')).toBeTruthy();
        expect(screen.queryByText('manual.pdf')).toBeNull();

        fireEvent.click(screen.getByText('Media'));

        expect(screen.queryByText('movie.mkv')).toBeNull();
    });
});
