import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { LayoutDashboard, Settings } from 'lucide-react';
import TopBarTabs from './TopBarTabs';

function renderWithRouter(ui: ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('TopBarTabs', () => {
    it('renders link tabs with counts and hides labels on mobile', () => {
        renderWithRouter(
            <TopBarTabs
                activeKey="downloading"
                hideLabelsOnMobile
                tabs={[
                    {
                        key: 'downloading',
                        label: 'Downloading',
                        icon: LayoutDashboard,
                        count: 3,
                        to: '/tasks/downloading',
                    },
                    { key: 'stopped', label: 'Stopped', icon: Settings, count: 0, to: '/tasks/stopped' },
                ]}
            />,
        );

        const activeLink = screen.getByRole('link', { name: /Downloading/ });

        expect(activeLink.getAttribute('href')).toBe('/tasks/downloading');
        expect(activeLink.className).toContain('text-primary');
        expect(screen.getByText('3')).toBeDefined();
        expect(screen.getByText('Stopped').className).toContain('hidden md:inline');
    });

    it('renders button tabs without hiding labels and calls onClick', () => {
        const onUrlsClick = vi.fn();

        renderWithRouter(
            <TopBarTabs
                activeKey="urls"
                tabs={[
                    { key: 'urls', label: 'URLs', onClick: onUrlsClick },
                    { key: 'torrent', label: 'Torrent', onClick: vi.fn() },
                ]}
            />,
        );

        const urlsButton = screen.getByRole('button', { name: 'URLs' });

        expect(urlsButton.className).toContain('text-primary');
        expect(urlsButton.className).not.toContain('hidden md:inline');

        fireEvent.click(urlsButton);

        expect(onUrlsClick).toHaveBeenCalledTimes(1);
    });
});
