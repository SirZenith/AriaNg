import {
    CheckCircle2,
    Clock,
    Download,
    Plus,
    Server,
    Settings,
    SlidersHorizontal,
    Wrench,
    type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

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
}

const navItemClass = ({ isActive }: { isActive: boolean }) =>
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] leading-tight transition-colors ' +
    (isActive
        ? 'text-[#3c8dbc] dark:text-[#5ba7d6]'
        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100');

export default function BottomNav({ counts, debugMode }: BottomNavProps) {
    const { t } = useTranslation();

    const items: NavItem[] = [
        { to: '/downloading', icon: Download, label: t('Downloading'), badge: counts.active },
        { to: '/waiting', icon: Clock, label: t('Waiting'), badge: counts.waiting },
        { to: '/stopped', icon: CheckCircle2, label: t('Finished / Stopped'), badge: counts.stopped },
        { to: '/new', icon: Plus, label: t('New') },
        { to: '/settings/ariang', icon: Settings, label: t('Settings') },
        { to: '/settings/aria2/basic', icon: SlidersHorizontal, label: t('Aria2 Settings') },
        { to: '/status', icon: Server, label: t('Aria2 Status') },
        ...(debugMode ? [{ to: '/debug', icon: Wrench, label: t('Debug') }] : []),
    ];

    return (
        <nav className="flex shrink-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={navItemClass}
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
        </nav>
    );
}
