import { ListTodo, Plus, SlidersHorizontal, Wrench, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

interface BottomNavProps {
    counts: {
        active: number;
        waiting: number;
        stopped: number;
    };
    debugMode: boolean;
}

interface NavItem {
    to: string;
    icon: LucideIcon;
    label: string;
    badge?: number;
    paths?: string[];
}

const navItemClass = ({ isActive }: { isActive: boolean }) =>
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] leading-tight transition-colors ' +
    (isActive
        ? 'text-primary dark:text-primary-light'
        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100');

export default function BottomNav({ counts, debugMode }: BottomNavProps) {
    const { t } = useTranslation();
    const location = useLocation();

    const items: NavItem[] = [
        {
            to: '/tasks/downloading',
            icon: ListTodo,
            label: t('Tasks'),
            badge: counts.active + counts.waiting,
            paths: ['/tasks/downloading', '/tasks/waiting', '/tasks/stopped'],
        },
        { to: '/new', icon: Plus, label: t('New') },
        { to: '/settings', icon: SlidersHorizontal, label: t('Aria2 Settings') },
        ...(debugMode ? [{ to: '/debug', icon: Wrench, label: t('Debug') }] : []),
    ];

    return (
        <nav className="bottom-nav">
            <div className="mx-auto flex w-full">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                navItemClass({
                                    isActive: item.paths ? item.paths.indexOf(location.pathname) >= 0 : isActive,
                                })
                            }
                            title={item.label}
                            aria-label={item.label}
                        >
                            <span className="relative">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                                {item.badge && item.badge > 0 ? (
                                    <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 text-white">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </span>
                            <span className="w-full truncate text-center">{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
