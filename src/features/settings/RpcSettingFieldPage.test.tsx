import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRpcDraftStore } from '@/stores/rpcDraftStore';
import RpcSettingFieldPage from './RpcSettingFieldPage';

afterEach(() => {
    window.localStorage.clear();
    useRpcDraftStore.setState({ drafts: {} });
});

describe('RpcSettingFieldPage', () => {
    it('stores the selected value into the rpc draft', () => {
        render(<RpcSettingFieldPage rpcItem="0" field="protocol" />);

        fireEvent.click(screen.getByRole('option', { name: 'wss' }));

        expect(useRpcDraftStore.getState().drafts['0'].protocol).toBe('wss');
        expect(screen.getByRole('option', { name: 'wss', selected: true })).toBeTruthy();
    });
});
