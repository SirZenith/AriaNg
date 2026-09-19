import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useRpcDraftStore } from '@/stores/rpcDraftStore';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import RpcSettingFieldPage from './RpcSettingFieldPage';

afterEach(() => {
    window.localStorage.clear();
    useRpcDraftStore.setState({ drafts: {} });
});

describe('RpcSettingFieldPage', () => {
    it('stores the selected value into the rpc draft', () => {
        renderWithPanelBars(
            <MemoryRouter>
                <RpcSettingFieldPage rpcItem="0" field="protocol" />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('option', { name: 'wss' }));

        expect(useRpcDraftStore.getState().drafts['0'].protocol).toBe('wss');
        expect(screen.getByRole('option', { name: 'wss', selected: true })).toBeTruthy();
    });
});
