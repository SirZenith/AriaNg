import { type ReactNode } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import AppFooter from './AppFooter';
import BottomNav from './BottomNav';
import NotificationContainer from './NotificationContainer';
import SettingsToolbar from './SettingsToolbar';
import TaskListToolbar from './TaskListToolbar';
import {
    useBrowserNotificationEvents,
    useDynamicTitle,
    useGlobalStatPolling,
    useLanguageSync,
    useRpcConnectionWatcher,
    useTheme,
} from '@/hooks/useAria2';
import { isEnableDebugMode } from '@/services/settingService';
import { useTaskStore } from '@/stores/taskStore';

export default function AppLayout({ children }: { children: ReactNode }) {
    const location = useLocation();

    useLanguageSync();
    useTheme();
    useRpcConnectionWatcher();
    useGlobalStatPolling();
    useDynamicTitle();
    useBrowserNotificationEvents();

    const globalStat = useTaskStore((state) => state.globalStat);

    const debugMode = isEnableDebugMode();

    const headerContentByPattern: { pattern: string; content: ReactNode }[] = [
        { pattern: '/downloading', content: <TaskListToolbar /> },
        { pattern: '/waiting', content: <TaskListToolbar /> },
        { pattern: '/stopped', content: <TaskListToolbar /> },
        { pattern: '/settings/*', content: <SettingsToolbar /> },
    ];

    const headerContent = headerContentByPattern.find(({ pattern }) => matchPath(pattern, location.pathname))?.content;

    return (
        <div className="flex h-full flex-col">
            {headerContent ? (
                <header className="bg-[#3c4852] px-4 py-1.5 text-white sm:py-2">{headerContent}</header>
            ) : null}

            <main className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-gutter:stable_both-edges]">
                <div className="mx-auto w-full max-w-[1000px]">{children}</div>
            </main>

            <AppFooter />

            <BottomNav
                counts={{
                    active: globalStat.numActive,
                    waiting: globalStat.numWaiting,
                    stopped: globalStat.numStopped,
                }}
                debugMode={debugMode}
            />

            <NotificationContainer />
        </div>
    );
}
