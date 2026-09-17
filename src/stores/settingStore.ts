import { create } from 'zustand';
import { ariaNgConstants, type AriaNgOptions } from '@/config/constants';
import { getOptions, resetOptions, setOptions as persistOptions } from '@/services/settingService';

interface SettingState {
    options: AriaNgOptions;
    setOption: <K extends keyof AriaNgOptions>(key: K, value: AriaNgOptions[K]) => void;
    updateOptions: (options: Partial<AriaNgOptions>) => void;
    reset: () => void;
}

export const useSettingStore = create<SettingState>((set) => ({
    options: getOptions(),
    setOption: (key, value) => {
        const next = { ...getOptions(), [key]: value };
        persistOptions(next);
        set({ options: next });
    },
    updateOptions: (partial) => {
        const next = { ...getOptions(), ...partial };
        persistOptions(next);
        set({ options: next });
    },
    reset: () => {
        resetOptions();
        set({ options: getOptions() });
    },
}));

export { ariaNgConstants };
