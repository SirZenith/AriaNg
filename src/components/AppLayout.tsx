import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { matchPath, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import NotificationContainer from './NotificationContainer';
import QuickSettingDialog from './QuickSettingDialog';
import SettingsToolbar from './SettingsToolbar';
import SpeedChart from './SpeedChart';
import TaskListToolbar from './TaskListToolbar';
import {
    useBrowserNotificationEvents,
    useDynamicTitle,
    useGlobalStatPolling,
    useLanguageSync,
    useRpcConnectionWatcher,
    useTheme,
} from '@/hooks/useAria2';
import { useMonitorStore } from '@/services/monitor';
import { isEnableDebugMode } from '@/services/settingService';
import { useTaskStore } from '@/stores/taskStore';
import { formatVolume } from '@/utils/format';

export default function AppLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const location = useLocation();
    const [showChart, setShowChart] = useState(false);
    const [quickSetting, setQuickSetting] = useState(false);

    useLanguageSync();
    useTheme();
    useRpcConnectionWatcher();
    useGlobalStatPolling();
    useDynamicTitle();
    useBrowserNotificationEvents();

    const rpcStatus = useTaskStore((state) => state.rpcStatus);
    const globalStat = useTaskStore((state) => state.globalStat);
    const globalStats = useMonitorStore((state) => state.globalStats);

    const debugMode = isEnableDebugMode();

    const statusLabelClass: Record<string, string> = {
        Connected: 'bg-green-600',
        Connecting: 'bg-blue-600',
        Reconnecting: 'bg-blue-600',
        Disconnected: 'bg-red-600',
        'Waiting to reconnect': 'bg-gray-500',
    };

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

            <footer className="bg-[#3c4852] px-4 py-1 text-xs text-white">
                <div className="relative mx-auto flex w-full max-w-[1000px] items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 ${statusLabelClass[rpcStatus] || 'bg-gray-500'}`}>
                            {t(rpcStatus)}
                        </span>
                        <button
                            type="button"
                            className="rounded px-2 py-0.5 hover:bg-white/10"
                            title={t('Global Rate Limit')}
                            onClick={() => setQuickSetting(true)}
                        >
                            {t('Global Rate Limit')}
                        </button>
                    </div>
                    <button
                        type="button"
                        className="flex items-center gap-4 rounded px-2 py-0.5 hover:bg-white/10"
                        title={t('Click to pin')}
                        onClick={() => setShowChart((value) => !value)}
                    >
                        <span>
                            <span className="mr-1 text-green-400">&#8595;</span>
                            {formatVolume(globalStat.downloadSpeed) + '/s'}
                        </span>
                        <span>
                            <span className="mr-1 text-blue-300">&#8593;</span>
                            {formatVolume(globalStat.uploadSpeed) + '/s'}
                        </span>
                    </button>

                    {showChart ? (
                        <div className="absolute bottom-full right-2 z-40 w-80 rounded border border-gray-300 bg-white p-2 shadow dark:border-gray-600 dark:bg-gray-800">
                            <SpeedChart data={globalStats} height={120} />
                        </div>
                    ) : null}
                </div>
            </footer>

            <BottomNav
                counts={{
                    active: globalStat.numActive,
                    waiting: globalStat.numWaiting,
                    stopped: globalStat.numStopped,
                }}
                debugMode={debugMode}
            />

            <NotificationContainer />

            {quickSetting ? (
                <QuickSettingDialog
                    type="globalSpeedLimit"
                    title="Global Rate Limit"
                    onClose={() => setQuickSetting(false)}
                />
            ) : null}
        </div>
    );
}
