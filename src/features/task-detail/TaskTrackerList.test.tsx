import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Aria2Task } from '@/types/aria2';
import TaskTrackerList from './TaskTrackerList';

function createTask(announceList: string[][]): Aria2Task {
    return {
        gid: 'gid',
        status: 'active',
        totalLength: '0',
        completedLength: '0',
        downloadSpeed: '0',
        uploadSpeed: '0',
        bittorrent: { announceList },
    };
}

describe('TaskTrackerList', () => {
    it('renders each tracker link on its own row', () => {
        render(
            <TaskTrackerList
                task={createTask([
                    ['udp://a.example:6969/announce'],
                    ['http://b.example/announce', 'https://c.example/announce'],
                ])}
            />,
        );

        expect(screen.getByText('udp://a.example:6969/announce')).toBeTruthy();
        expect(screen.getByText('http://b.example/announce')).toBeTruthy();
        expect(screen.getByText('https://c.example/announce')).toBeTruthy();
    });
});
