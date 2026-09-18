import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { settingsCategories, settingsSubItems } from './settingsCategories';

interface MenuItem {
    key: string;
    label: string;
    to: string;
    icon?: LucideIcon;
}

export default function SettingsMenu({ type }: { type?: string }) {
    const { t } = useTranslation();

    const subItems = type ? settingsSubItems[type] : undefined;

    const items: MenuItem[] = subItems
        ? subItems.map((item) => ({
              key: item.key,
              label: item.label,
              to: '/settings/aria2/' + type + '/' + item.key,
          }))
        : settingsCategories.map((category) => ({
              key: category.key,
              label: category.label,
              to: '/settings/aria2/' + category.key,
              icon: category.icon,
          }));

    return (
        <div className="overflow-hidden rounded bg-white shadow dark:bg-gray-800">
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <Link
                        key={item.key}
                        to={item.to}
                        className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                    >
                        {Icon ? <Icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" /> : null}
                        <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    </Link>
                );
            })}
        </div>
    );
}
