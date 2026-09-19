import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ariaNgDefaultOptions } from './config/constants';
import { addNewRpcSetting, getAllRpcSettings, getOptions, updateRpcSetting } from './services/settingService';
import { useRpcDraftStore } from './stores/rpcDraftStore';
import { useSettingStore } from './stores/settingStore';
import { useTaskStore } from './stores/taskStore';
import type { Aria2Task } from './types/aria2';
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
    Reflect.deleteProperty(window.navigator, 'registerProtocolHandler');
    Reflect.deleteProperty(window.navigator, 'unregisterProtocolHandler');
    window.localStorage.clear();
    window.location.hash = '';
    useSettingStore.setState({ options: ariaNgDefaultOptions });
    useRpcDraftStore.setState({ drafts: {} });
    useTaskStore.setState({ tasks: [] });
});

describe('App', () => {
    it('renders the application layout', () => {
        render(<App />);

        expect(screen.getByRole('link', { name: 'Add New RPC Setting' })).toBeTruthy();
        expect(screen.getByText('localhost:6800')).toBeTruthy();
    });

    it('reserves bottom padding for the floating bottom bar in the scroll container', () => {
        render(<App />);

        const main = document.querySelector('main[data-scroll-container]');

        expect(main?.className).toContain('app-scroll-container');
        expect(main?.className).not.toContain('pb-4');
    });

    it('shows the task list toolbar on task list routes', () => {
        window.location.hash = '#/tasks/waiting';
        render(<App />);

        expect(screen.getByPlaceholderText('Search')).toBeTruthy();
    });

    it('shows the settings header with a back button on settings routes', () => {
        window.location.hash = '#/settings/basic';
        render(<App />);

        expect(screen.getByText('Basic Settings')).toBeTruthy();
        expect(screen.getByLabelText('Back')).toBeTruthy();
        expect(screen.queryByText('Server:')).toBeNull();
    });

    it('registers and unregisters the magnet handler from the settings page', () => {
        const register = vi.fn();
        const unregister = vi.fn();

        Object.defineProperty(window.navigator, 'registerProtocolHandler', {
            value: register,
            configurable: true,
        });
        Object.defineProperty(window.navigator, 'unregisterProtocolHandler', {
            value: unregister,
            configurable: true,
        });

        window.location.hash = '#/ariang/general';
        render(<App />);

        const toggle = screen.getByRole('switch', { name: 'Register as Magnet Handler' });

        fireEvent.click(toggle);

        expect(register).toHaveBeenCalledWith('magnet', expect.stringContaining('#/new?uri=%s'));
        expect(useSettingStore.getState().options.registerMagnetHandler).toBe(true);

        fireEvent.click(toggle);

        expect(unregister).toHaveBeenCalledWith('magnet', expect.stringContaining('#/new?uri=%s'));
        expect(useSettingStore.getState().options.registerMagnetHandler).toBe(false);
    });

    it('opens the task settings panel on the new task page', () => {
        window.location.hash = '#/new';
        render(<App />);

        fireEvent.click(screen.getByText('Task Settings'));

        expect(screen.getAllByLabelText('Back').length).toBeGreaterThan(0);
        expect(screen.getByText('Confirm')).toBeTruthy();

        fireEvent.click(screen.getByText('Confirm'));

        expect(screen.queryByText('Confirm')).toBeNull();
    });

    it('hides the new task action button labels on small screens', () => {
        window.location.hash = '#/new';
        render(<App />);

        for (const label of ['Start', 'Pause', 'Task Settings']) {
            expect(screen.getByLabelText(label).querySelector('span')?.className).toContain('hidden');
        }
    });

    it('shows the task detail toolbar with a back button on the task detail page', () => {
        window.location.hash = '#/task/detail/gid123';
        render(<App />);

        expect(screen.getByLabelText('Back')).toBeTruthy();
    });

    it('navigates back from the task detail page', async () => {
        useTaskStore.setState({
            tasks: [
                {
                    gid: 'gid123',
                    status: 'active',
                    taskName: 'ubuntu.iso',
                    totalLength: 1000,
                    completedLength: 500,
                    completePercent: 50,
                    downloadSpeed: 0,
                    uploadSpeed: 0,
                    numPieces: 0,
                    bitfield: '',
                    files: [],
                    connections: 0,
                    remainTime: -1,
                } as unknown as Aria2Task,
            ],
        });
        window.location.hash = '#/tasks/downloading';
        render(<App />);

        fireEvent.click(screen.getByLabelText('Click to view task detail'));

        await screen.findByLabelText('Back');
        fireEvent.click(screen.getByLabelText('Back'));

        await waitFor(() => {
            expect(window.location.hash).toBe('#/tasks/downloading');
        });
    });

    it('does not render the task list toolbar on the new task page', () => {
        window.location.hash = '#/new';
        render(<App />);

        expect(screen.queryByPlaceholderText('Search')).toBeNull();
    });

    it('shows the settings category list', () => {
        window.location.hash = '#/settings';
        render(<App />);

        expect(screen.getByText('Basic Settings')).toBeTruthy();
        expect(screen.getByText('Protocol Settings')).toBeTruthy();
        expect(screen.getByLabelText('Back')).toBeTruthy();
        expect(screen.queryByText('Server:')).toBeNull();
    });

    it('redirects a protocol category link to the protocol settings page', async () => {
        window.location.hash = '#/settings/bt';
        render(<App />);

        await waitFor(() => {
            expect(window.location.hash).toBe('#/settings/protocol');
        });
    });

    it('redirects the ariang root route to home', async () => {
        window.location.hash = '#/ariang';
        render(<App />);

        await waitFor(() => {
            expect(window.location.hash).toBe('#/home');
        });
    });

    it('shows the rpc settings list without the settings tab bar', () => {
        window.location.hash = '#/ariang/rpc';
        render(<App />);

        expect(screen.getByText('RPC Settings')).toBeTruthy();
        expect(screen.queryByText('Import / Export AriaNg Settings')).toBeNull();
    });

    it('keeps the select all button visible on small screens', () => {
        stubMatchMedia({ mobile: true });
        window.location.hash = '#/tasks/downloading';
        render(<App />);

        expect(screen.getByLabelText('Select All').className).not.toContain('hidden');
    });

    it('shows the rpc setting list', () => {
        window.location.hash = '#/ariang/rpc';
        render(<App />);

        expect(screen.getByRole('link', { name: /localhost:6800/ })).toBeTruthy();
        expect(screen.getByText('Default')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Add New RPC Setting' })).toBeTruthy();
    });

    it('opens the rpc setting editor from the list', async () => {
        window.location.hash = '#/ariang/rpc';
        render(<App />);

        fireEvent.click(screen.getByRole('link', { name: /localhost:6800/ }));

        expect(await screen.findByText('Aria2 RPC Alias')).toBeTruthy();
        expect(screen.getByText('Save')).toBeTruthy();
    });

    it('saves the rpc setting and reloads', () => {
        window.location.hash = '#/ariang/rpc/0';
        render(<App />);

        fireEvent.change(screen.getByDisplayValue('localhost'), { target: { value: '192.168.1.2' } });
        fireEvent.click(screen.getByText('Save'));

        expect(getOptions().rpcHost).toBe('192.168.1.2');
        expect(vi.mocked(reloadPage)).toHaveBeenCalled();
    });

    it('keeps other rpc settings when saving', () => {
        addNewRpcSetting();
        updateRpcSetting(0, 'rpcAlias', 'Server A');
        updateRpcSetting(0, 'rpcHost', '10.0.0.2');
        addNewRpcSetting();
        updateRpcSetting(1, 'rpcAlias', 'Server B');
        updateRpcSetting(1, 'rpcHost', '10.0.0.3');

        window.location.hash = '#/ariang/rpc/0';
        render(<App />);

        fireEvent.change(screen.getByDisplayValue('10.0.0.2'), { target: { value: '192.168.1.2' } });
        fireEvent.click(screen.getByText('Save'));

        const settings = getAllRpcSettings();

        expect(settings.find((item) => item.isDefault)?.rpcHost).toBe('192.168.1.2');
        expect(settings.some((item) => item.rpcHost === '10.0.0.3')).toBe(true);
        expect(getOptions().rpcHost).toBe('192.168.1.2');
    });

    it('navigates the settings hierarchy and back', async () => {
        window.location.hash = '#/settings';
        render(<App />);

        fireEvent.click(screen.getByText('Protocol Settings'));

        await waitFor(() => {
            expect(window.location.hash).toBe('#/settings/protocol');
        });

        fireEvent.click(screen.getByLabelText('Back'));

        expect(await screen.findByText('Basic Settings')).toBeTruthy();
    });

    it('opens a setting value page and keeps the selection', async () => {
        window.location.hash = '#/ariang/general';
        render(<App />);

        fireEvent.click(screen.getByRole('link', { name: /Theme/ }));

        fireEvent.click(await screen.findByRole('option', { name: 'Dark' }));

        expect(screen.getByRole('option', { name: 'Dark', selected: true })).toBeTruthy();
        expect(getOptions().theme).toBe('dark');

        fireEvent.click(screen.getByLabelText('Back'));

        expect((await screen.findByRole('link', { name: /Theme/ })).textContent).toContain('Dark');
    });

    it('opens the rpc protocol choice page from the editor', async () => {
        window.location.hash = '#/ariang/rpc/0';
        render(<App />);

        fireEvent.click(screen.getByRole('link', { name: 'http' }));

        fireEvent.click(await screen.findByRole('option', { name: 'wss' }));

        fireEvent.click(screen.getByLabelText('Back'));

        expect(await screen.findByRole('link', { name: 'wss' })).toBeTruthy();
    });
});
