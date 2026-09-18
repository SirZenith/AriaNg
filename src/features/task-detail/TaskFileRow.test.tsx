import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Aria2File } from '@/types/aria2';
import TaskFileRow from './TaskFileRow';

function createFile(overrides: Partial<Aria2File>): Aria2File {
    return {
        index: '1',
        path: '/downloads/file.mkv',
        length: '1048576',
        completedLength: '0',
        selected: 'true',
        ...overrides,
    };
}

describe('TaskFileRow', () => {
    it('renders a directory with a folder toggle button and no progress', () => {
        const onToggleCollapse = vi.fn();

        render(
            <TaskFileRow
                file={createFile({ isDir: true, nodeName: 'Season 1', nodePath: 'Season 1', relativePath: '' })}
                indent={0}
                isMultiDir
                choosing={false}
                selected={false}
                collapsed={false}
                onToggleCollapse={onToggleCollapse}
                onToggleSelected={vi.fn()}
                onToggleDir={vi.fn()}
            />,
        );

        expect(screen.getByText('Season 1')).toBeTruthy();
        expect(screen.queryByText(/%$/)).toBeNull();

        fireEvent.click(screen.getByLabelText('Collapse'));

        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('renders a file with progress and size', () => {
        render(
            <TaskFileRow
                file={createFile({ fileName: 'movie.mkv', completePercent: 42.5 })}
                indent={16}
                isMultiDir
                choosing={false}
                selected
                collapsed={false}
                onToggleCollapse={vi.fn()}
                onToggleSelected={vi.fn()}
                onToggleDir={vi.fn()}
            />,
        );

        expect(screen.getByText('movie.mkv')).toBeTruthy();
        expect(screen.getAllByText('42.50%')).toHaveLength(1);
        expect(screen.getByRole('img', { name: '42.50%' })).toBeTruthy();
        expect(screen.getByText('1.00 MB')).toBeTruthy();
    });
});
