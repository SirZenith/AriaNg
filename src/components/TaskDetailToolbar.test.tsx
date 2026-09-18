import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useTaskDetailStore } from '@/stores/taskDetailStore';
import TaskDetailToolbar from './TaskDetailToolbar';

function renderToolbar() {
    return render(
        <MemoryRouter initialEntries={['/task/detail/gid123']}>
            <TaskDetailToolbar />
        </MemoryRouter>,
    );
}

afterEach(() => {
    useTaskDetailStore.setState({ gid: null, taskName: '' });
});

describe('TaskDetailToolbar', () => {
    it('shows the name of the task being viewed', () => {
        useTaskDetailStore.setState({ gid: 'gid123', taskName: 'ubuntu.iso' });

        renderToolbar();

        expect(screen.getByText('ubuntu.iso')).toBeTruthy();
        expect(screen.getByLabelText('Back')).toBeTruthy();
    });

    it('does not show the name of another task', () => {
        useTaskDetailStore.setState({ gid: 'gid456', taskName: 'debian.iso' });

        renderToolbar();

        expect(screen.queryByText('debian.iso')).toBeNull();
        expect(screen.getByLabelText('Back')).toBeTruthy();
    });
});
