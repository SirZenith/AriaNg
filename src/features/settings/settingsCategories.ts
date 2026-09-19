import { Globe, Network, Server, Settings2, Wrench, type LucideIcon } from 'lucide-react';
import { ariaNgSettingsTabs } from './ariaNgSettingsTabs';

export const settingsCategories: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'basic', label: 'Basic Settings', icon: Settings2 },
    { key: 'protocol', label: 'Protocol Settings', icon: Globe },
    { key: 'rpc', label: 'RPC Settings', icon: Network },
    { key: 'advanced', label: 'Advanced Settings', icon: Wrench },
    { key: 'status', label: 'Aria2 Status', icon: Server },
];

export const settingsSubItems: Record<string, { key: string; label: string, icon?: LucideIcon }[]> = {
    ariang: ariaNgSettingsTabs,
};

export function getSettingsCategory(key: string) {
    return settingsCategories.find((category) => category.key === key);
}

export function getSettingsSubItem(type: string, sub: string) {
    return settingsSubItems[type]?.find((item) => item.key === sub);
}
