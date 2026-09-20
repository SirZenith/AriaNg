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

    it('toggles the directory by clicking the row while choosing', () => {
        const onToggleCollapse = vi.fn();

        render(
            <TaskFileRow
                file={createFile({ isDir: true, nodeName: 'Season 1', nodePath: 'Season 1', relativePath: '' })}
                indent={0}
                isMultiDir
                choosing
                selected={false}
                collapsed={false}
                onToggleCollapse={onToggleCollapse}
                onToggleSelected={vi.fn()}
                onToggleDir={vi.fn()}
            />,
        );

        expect(screen.getByLabelText('Collapse')).toBeTruthy();

        fireEvent.click(screen.getByText('Season 1'));

        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('does not toggle the directory when clicking its checkbox while choosing', () => {
        const onToggleCollapse = vi.fn();
        const onToggleDir = vi.fn();

        render(
            <TaskFileRow
                file={createFile({ isDir: true, nodeName: 'Season 1', nodePath: 'Season 1', relativePath: '' })}
                indent={0}
                isMultiDir
                choosing
                selected={false}
                collapsed={false}
                onToggleCollapse={onToggleCollapse}
                onToggleSelected={vi.fn()}
                onToggleDir={onToggleDir}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(onToggleDir).toHaveBeenCalledTimes(1);
        expect(onToggleCollapse).not.toHaveBeenCalled();
    });

    it('reserves a checkbox-sized slot on file rows when not choosing', () => {
        const { container } = render(
            <TaskFileRow
                file={createFile({ fileName: 'movie.mkv' })}
                indent={0}
                isMultiDir={false}
                choosing={false}
                selected={false}
                collapsed={false}
                onToggleCollapse={vi.fn()}
                onToggleSelected={vi.fn()}
                onToggleDir={vi.fn()}
            />,
        );

        const content = container.querySelector('div[class*="grid-cols-12"]')?.firstElementChild;
        const slot = content?.firstElementChild;

        expect(slot?.tagName).toBe('SPAN');
        expect(slot?.className).toContain('h-4');
        expect(slot?.className).toContain('w-4');
        expect(screen.queryByRole('checkbox')).toBeNull();
    });

    it('renders the same sized slot as a checkbox on file rows while choosing', () => {
        render(
            <TaskFileRow
                file={createFile({ fileName: 'movie.mkv' })}
                indent={0}
                isMultiDir={false}
                choosing
                selected={false}
                collapsed={false}
                onToggleCollapse={vi.fn()}
                onToggleSelected={vi.fn()}
                onToggleDir={vi.fn()}
            />,
        );

        const checkbox = screen.getByRole('checkbox');

        expect(checkbox.className).toContain('h-4');
        expect(checkbox.className).toContain('w-4');
    });

    it('reserves the slot on directory rows when not choosing', () => {
        const { container } = render(
            <TaskFileRow
                file={createFile({ isDir: true, nodeName: 'Season 1', nodePath: 'Season 1', relativePath: '' })}
                indent={0}
                isMultiDir
                choosing={false}
                selected={false}
                collapsed={false}
                onToggleCollapse={vi.fn()}
                onToggleSelected={vi.fn()}
                onToggleDir={vi.fn()}
            />,
        );

        const content = container.querySelector('div[class*="grid-cols-12"]')?.firstElementChild;

        expect(content?.firstElementChild?.tagName).toBe('SPAN');
        expect(screen.getByLabelText('Collapse')).toBeTruthy();
    });
});
