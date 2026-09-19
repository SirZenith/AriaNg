import { type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface TopBarTabItem {
    key: string;
    label?: string;
    icon?: LucideIcon;
    count?: number;
    to?: string;
    onClick?: () => void;
}

interface TopBarTabsProps {
    tabs: TopBarTabItem[];
    activeKey: string;
    hideLabelsOnMobile?: boolean;
}

const tabBaseClass =
    'flex min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-sm transition-colors ';
const tabActiveClass =
    'border-white bg-white font-medium text-primary shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-primary-light';
const tabInactiveClass =
    'border-black/5 bg-white/50 text-gray-600 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10';

export default function TopBarTabs({ tabs, activeKey, hideLabelsOnMobile = false }: TopBarTabsProps) {
    return (
        <div className="mx-auto mt-2 w-full max-w-250">
            <div className="flex items-stretch gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/10">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeKey === tab.key;
                    const className = tabBaseClass + (isActive ? tabActiveClass : tabInactiveClass);
                    const content = (
                        <>
                            {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                            {tab.label ? (
                                <span className={hideLabelsOnMobile ? 'hidden md:inline' : undefined}>{tab.label}</span>
                            ) : null}
                            {tab.count !== undefined ? (
                                <span className="shrink-0 rounded-full bg-black/10 px-1.5 text-[10px] dark:bg-white/15">
                                    {tab.count}
                                </span>
                            ) : null}
                        </>
                    );

                    if (tab.to) {
                        return (
                            <Link key={tab.key} to={tab.to} className={className}>
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button key={tab.key} type="button" className={className} onClick={tab.onClick}>
                            {content}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
