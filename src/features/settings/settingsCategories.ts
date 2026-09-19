import { Globe, Network, Server, Info, Settings2, Wrench, Blocks, Save, type LucideIcon } from 'lucide-react';

export interface SettingEntry {
    key: string;
    label: string;
    icon?: LucideIcon;
}

export type SettingCategory = 'system' | 'ariang';

export const settingsSubItems: Record<SettingCategory, SettingEntry[]> = {
    system: [
        { key: 'basic', label: 'Basic Settings', icon: Settings2 },
        { key: 'protocol', label: 'Protocol Settings', icon: Globe },
        { key: 'rpc', label: 'RPC Settings', icon: Network },
        { key: 'advanced', label: 'Advanced Settings', icon: Wrench },
        { key: 'status', label: 'Aria2 Status', icon: Info },
    ],
    ariang: [
        { key: 'general', label: 'Settings', icon: Blocks },
        { key: 'rpc', label: 'RPC Settings', icon: Server },
        { key: 'importExport', label: 'Import / Export AriaNg Settings', icon: Save },
    ],
};

export function getSettingsCategory(key: string) {
    return settingsSubItems.system.find((category) => category.key === key);
}

export function getSettingsSubItem(type: string, sub: string) {
    return settingsSubItems[type as SettingCategory]?.find((item) => item.key === sub);
}
