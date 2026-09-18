import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsItem from '@/components/settings/SettingsItem';
import { settingsCategories, settingsSubItems } from './settingsCategories';

interface MenuItem {
    key: string;
    label: string;
    to: string;
    icon?: LucideIcon;
}

export default function SettingsMenu({ type }: { type?: string; }) {
    const { t } = useTranslation();

    const subItems = type ? settingsSubItems[type] : undefined;

    const items: MenuItem[] = subItems
        ? subItems.map((item) => ({
            key: item.key,
            label: item.label,
            to: '/settings/' + type + '/' + item.key,
        }))
        : settingsCategories.map((category) => ({
            key: category.key,
            label: category.label,
            to: '/settings/' + category.key,
            icon: category.icon,
        }));

    return (
        <SettingsCard>
            {items.map((item) => (
                <SettingsItem
                    key={item.key}
                    icon={item.icon}
                    label={t(item.label)}
                    indicator={{ type: 'navigate' }}
                    to={item.to}
                />
            ))}
        </SettingsCard>
    );
}
