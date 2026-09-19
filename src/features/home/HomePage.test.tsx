import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useTaskStore } from '@/stores/taskStore';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import HomePage from './HomePage';

vi.mock('@/services/aria2SettingService', () => ({
    aria2SettingService: {
        getAria2Status: vi.fn(async () => ({ success: true, data: { version: '1.37.0' } })),
    },
}));

function renderPage() {
    return renderWithPanelBars(
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>,
    );
}

afterEach(() => {
    useTaskStore.setState({ rpcStatus: 'Connecting' });
});

describe('HomePage', () => {
    it('shows the rpc settings list while not connected', () => {
        useTaskStore.setState({ rpcStatus: 'Disconnected' });

        renderPage();

        expect(screen.getByText('Add New RPC Setting')).toBeTruthy();
        expect(screen.queryByText('Connection Status')).toBeNull();
        expect(screen.queryByRole('link', { name: 'Tasks' })).toBeNull();
    });

    it('shows the connection status and function entries when connected', async () => {
        useTaskStore.setState({ rpcStatus: 'Connected' });

        renderPage();

        expect(screen.getByText('Connection Status')).toBeTruthy();
        expect(screen.getByText('Connected')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Tasks' })).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Settings' })).toBeTruthy();
        expect(await screen.findByText('1.37.0')).toBeTruthy();
    });
});
