import { create } from 'zustand';
import type { AriaNgRpcSetting } from '@/config/constants';
import { createRpcSetting, getAllRpcSettings } from '@/services/settingService';

interface RpcDraftState {
    drafts: Record<string, AriaNgRpcSetting>;
    setField: (item: string, field: keyof AriaNgRpcSetting, value: string) => void;
    clearDraft: (item: string) => void;
}

export function createRpcDraft(item: string): AriaNgRpcSetting {
    if (item === 'new') {
        return createRpcSetting();
    }

    const existing = getAllRpcSettings()[Number(item)];

    return existing ? { ...existing } : createRpcSetting();
}

export const useRpcDraftStore = create<RpcDraftState>((set) => ({
    drafts: {},
    setField: (item, field, value) =>
        set((state) => {
            const current = state.drafts[item] ?? createRpcDraft(item);

            return { drafts: { ...state.drafts, [item]: { ...current, [field]: value } } };
        }),
    clearDraft: (item) =>
        set((state) => {
            const next = { ...state.drafts };
            delete next[item];

            return { drafts: next };
        }),
}));
