import { render, screen } from '@testing-library/react';
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
    it('renders the folder toggle button only for directories', () => {
        render(<TaskFileList task={createTask()} onChanged={vi.fn()} />);

        expect(screen.getAllByLabelText(/Expand|Collapse/)).toHaveLength(2);

        const fileRow = screen.getByText('movie.mkv').closest('div');
        expect(fileRow?.querySelector('button')).toBeNull();
    });
});
