import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Aria2Peer } from '@/types/aria2';
import { copyText } from '@/utils/clipboard';
import TaskPeerList from './TaskPeerList';

vi.mock('@/utils/clipboard', () => ({
    copyText: vi.fn(() => Promise.resolve(true)),
}));

function createPeer(overrides: Partial<Aria2Peer>): Aria2Peer {
    return {
        ip: '1.2.3.4',
        port: '6881',
        downloadSpeed: 0,
        uploadSpeed: 0,
        ...overrides,
    };
}

describe('TaskPeerList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders each peer as a card with ip, client, progress and speeds', () => {
        render(
            <TaskPeerList
                peers={[
                    createPeer({
                        name: '1.2.3.4:6881',
                        client: { name: 'qBittorrent', version: '4.5.0', info: 'qBittorrent 4.5.0' },
                        completePercent: 50,
                        downloadSpeed: 1024,
                        uploadSpeed: 2048,
                    }),
                ]}
            />,
        );

        expect(screen.getByText('1.2.3.4')).toBeTruthy();
        expect(screen.getByText('qBittorrent 4.5.0')).toBeTruthy();
        expect(screen.getByText('50.00%')).toBeTruthy();
        expect(screen.getByText('1.00 KB/s')).toBeTruthy();
        expect(screen.getByText('2.00 KB/s')).toBeTruthy();
    });

    it('collapses a long ip in the middle and copies the full value', async () => {
        const longIp = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

        render(<TaskPeerList peers={[createPeer({ ip: longIp, name: longIp + ':6881' })]} />);

        expect(screen.queryByText(longIp)).toBeNull();
        expect(screen.getByText(/…/)).toBeTruthy();

        fireEvent.click(screen.getByLabelText('Copy'));

        await vi.waitFor(() => {
            expect(copyText).toHaveBeenCalledWith(longIp);
        });
    });
});
