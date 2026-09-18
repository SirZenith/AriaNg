import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { getOptions } from './services/settingService';
import { reloadPage } from './utils/navigation';

vi.mock('./utils/navigation', () => ({ reloadPage: vi.fn() }));

function stubMatchMedia({ mobile }: { mobile: boolean }) {
    vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
            matches: mobile && query.includes('max-width'),
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    );
}

beforeEach(() => {
    vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise<never>(() => undefined)),
    );
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    window.location.hash = '';
});

describe('App', () => {
    it('renders the application layout', () => {
        render(<App />);

        expect(screen.getByRole('banner')).toBeTruthy();
        expect(screen.getByText('Tasks')).toBeTruthy();
        expect(screen.getByText('Downloading')).toBeTruthy();
        expect(screen.getByText('Waiting')).toBeTruthy();
        expect(screen.getAllByText('Aria2 Settings').length).toBeGreaterThan(0);
    });

    it('shows the header on task list routes', () => {
        window.location.hash = '#/waiting';
        render(<App />);

        expect(screen.getByRole('banner')).toBeTruthy();
        expect(screen.getByPlaceholderText('Search')).toBeTruthy();
    });

    it('shows the rpc selector on settings routes', () => {
        window.location.hash = '#/settings/aria2/basic';
        render(<App />);

        expect(screen.getByRole('banner')).toBeTruthy();
        expect(screen.getByText('Server:')).toBeTruthy();
        expect(screen.getByTitle('RPC Settings')).toBeTruthy();
    });

    it('hides the header on routes without mapped content', () => {
        window.location.hash = '#/new';
        render(<App />);

        expect(screen.queryByRole('banner')).toBeNull();
    });

    it('shows the settings category list on small screens', () => {
        stubMatchMedia({ mobile: true });
        window.location.hash = '#/settings/aria2';
        render(<App />);

        expect(screen.getByText('Basic Settings')).toBeTruthy();
        expect(screen.getByText('Protocol Settings')).toBeTruthy();
        expect(screen.getByLabelText('Back')).toBeTruthy();
        expect(screen.queryByText('Server:')).toBeNull();
    });

    it('shows the settings sub item list on small screens', () => {
        stubMatchMedia({ mobile: true });
        window.location.hash = '#/settings/aria2/ariang';
        render(<App />);

        expect(screen.getByText('RPC Settings')).toBeTruthy();
        expect(screen.getByText('Import / Export AriaNg Settings')).toBeTruthy();
    });

    it('shows the settings panel without tab bar on small screens', () => {
        stubMatchMedia({ mobile: true });
        window.location.hash = '#/settings/aria2/ariang/rpc';
        render(<App />);

        expect(screen.getByText('RPC Settings')).toBeTruthy();
        expect(screen.queryByText('Import / Export AriaNg Settings')).toBeNull();
    });

    it('shows the save button in the desktop rpc settings', () => {
        window.location.hash = '#/settings/aria2/ariang/rpc';
        render(<App />);

        expect(screen.getByText('Save')).toBeTruthy();
        expect(screen.queryByText('Activate')).toBeNull();
    });

    it('saves and reloads from the desktop rpc settings', () => {
        window.location.hash = '#/settings/aria2/ariang/rpc';
        render(<App />);

        fireEvent.click(screen.getByText('Save'));

        expect(vi.mocked(reloadPage)).toHaveBeenCalled();
    });

    it('shows the rpc setting list on small screens', () => {
        stubMatchMedia({ mobile: true });
        window.location.hash = '#/settings/aria2/ariang/rpc';
        render(<App />);

        expect(screen.getByRole('link', { name: /localhost:6800/ })).toBeTruthy();
        expect(screen.getByText('Default')).toBeTruthy();
        expect(screen.getByText('Add New RPC Setting')).toBeTruthy();
    });

    it('opens the rpc setting editor from the list on small screens', async () => {
        stubMatchMedia({ mobile: true });
        window.location.hash = '#/settings/aria2/ariang/rpc';
        render(<App />);

        fireEvent.click(screen.getByRole('link', { name: /localhost:6800/ }));

        expect(await screen.findByText('Aria2 RPC Alias')).toBeTruthy();
        expect(screen.getByText('Save')).toBeTruthy();
    });

    it('saves the rpc setting and reloads on small screens', () => {
        stubMatchMedia({ mobile: true });
        window.location.hash = '#/settings/aria2/ariang/rpc/0';
        render(<App />);

        fireEvent.change(screen.getByDisplayValue('localhost'), { target: { value: '192.168.1.2' } });
        fireEvent.click(screen.getByText('Save'));

        expect(getOptions().rpcHost).toBe('192.168.1.2');
        expect(vi.mocked(reloadPage)).toHaveBeenCalled();
    });

    it('navigates the settings hierarchy and back on small screens', async () => {
        stubMatchMedia({ mobile: true });
        window.location.hash = '#/settings/aria2';
        render(<App />);

        fireEvent.click(screen.getByText('Protocol Settings'));

        expect(await screen.findByText('BitTorrent Settings')).toBeTruthy();

        fireEvent.click(screen.getByLabelText('Back'));

        expect(await screen.findByText('Basic Settings')).toBeTruthy();
    });
});
