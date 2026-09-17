import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Pause, Play, Plus, Search, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from './BottomNav';
import NotificationContainer from './NotificationContainer';
import QuickSettingDialog from './QuickSettingDialog';
import SpeedChart from './SpeedChart';
import {
    useBrowserNotificationEvents,
    useDynamicTitle,
    useGlobalStatPolling,
    useKeyboardShortcuts,
    useLanguageSync,
    useRpcConnectionWatcher,
    useTheme,
} from '@/hooks/useAria2';
import { useMonitorStore } from '@/services/monitor';
import { getAllRpcSettings, isEnableDebugMode, setDefaultRpcSetting } from '@/services/settingService';
import { aria2TaskService } from '@/services/taskService';
import { getBuildVersion } from '@/services/version';
import { useSettingStore } from '@/stores/settingStore';
import { useTaskStore } from '@/stores/taskStore';
import { formatVolume } from '@/utils/format';

const toolbarButtonClass =
    'flex items-center gap-1 rounded px-2 py-1.5 text-sm hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent';

export default function AppLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const desktopSearchRef = useRef<HTMLInputElement>(null);
    const mobileSearchRef = useRef<HTMLInputElement>(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [quickSetting, setQuickSetting] = useState(false);

    useLanguageSync();
    useTheme();
    useRpcConnectionWatcher();
    useGlobalStatPolling();
    useDynamicTitle();
    useBrowserNotificationEvents();

    const options = useSettingStore((state) => state.options);
    const rpcStatus = useTaskStore((state) => state.rpcStatus);
    const globalStat = useTaskStore((state) => state.globalStat);
    const tasks = useTaskStore((state) => state.tasks);
    const selected = useTaskStore((state) => state.selected);
    const searchKeyword = useTaskStore((state) => state.searchKeyword);
    const setSearchKeyword = useTaskStore((state) => state.setSearchKeyword);
    const clearSelected = useTaskStore((state) => state.clearSelected);
    const selectAll = useTaskStore((state) => state.selectAll);
    const globalStats = useMonitorStore((state) => state.globalStats);

    const selectedTasks = tasks.filter((task) => selected[task.gid]);
    const rpcSettings = useMemo(() => getAllRpcSettings(), []);
    const debugMode = isEnableDebugMode();

    const changeTasksState = async (state: 'start' | 'pause') => {
        const gids = selectedTasks.map((task) => task.gid);

        if (gids.length < 1) {
            return;
        }

        if (state === 'start') {
            await aria2TaskService.startTasks(gids);
        } else {
            await aria2TaskService.pauseTasks(gids);
        }

        clearSelected();
    };

    const removeTasks = async () => {
        if (selectedTasks.length < 1) {
            return;
        }

        if (options.confirmTaskRemoval && !window.confirm(t('Are you sure you want to remove the selected tasks?'))) {
            return;
        }

        await aria2TaskService.removeTasks(selectedTasks);
        clearSelected();
    };

    const focusSearchBox = () => {
        if (window.matchMedia('(min-width: 640px)').matches) {
            desktopSearchRef.current?.focus();
            return;
        }

        setShowMobileSearch(true);
        window.setTimeout(() => mobileSearchRef.current?.focus(), 0);
    };

    useKeyboardShortcuts({
        selectAll: () => selectAll(),
        delete: () => {
            void removeTasks();
        },
        find: focusSearchBox,
    });

    const changeRpc = (index: number) => {
        const settings = getAllRpcSettings();
        const target = settings[index];

        if (!target || target.isDefault) {
            return;
        }

        setDefaultRpcSetting(target);
        window.location.reload();
    };

    const statusLabelClass: Record<string, string> = {
        Connected: 'bg-green-600',
        Connecting: 'bg-blue-600',
        Reconnecting: 'bg-blue-600',
        Disconnected: 'bg-red-600',
        'Waiting to reconnect': 'bg-gray-500',
    };

    return (
        <div className="flex h-full flex-col">
            <header className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-[#3c4852] px-2 py-1.5 text-white sm:gap-x-3 sm:px-3 sm:py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="text-base font-semibold sm:text-lg" title={'AriaNg ' + getBuildVersion()}>
                        AriaNg
                    </span>
                    <select
                        className="max-w-[5.5rem] truncate rounded border border-white/30 bg-[#3c4852] px-1 py-0.5 text-xs sm:max-w-[14rem]"
                        value={rpcSettings.findIndex((item) => item.isDefault)}
                        onChange={(event) => changeRpc(Number(event.target.value))}
                        title={t('RPC Settings')}
                    >
                        {rpcSettings.map((item, index) => (
                            <option key={index} value={index}>
                                {item.rpcAlias || item.rpcHost + ':' + item.rpcPort}
                                {item.protocol === 'ws' || item.protocol === 'wss' ? ' (WS)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1">
                    <Link to="/new" className={toolbarButtonClass} title={t('New')} aria-label={t('New')}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('New')}</span>
                    </Link>
                    <button
                        type="button"
                        className={toolbarButtonClass}
                        disabled={selectedTasks.length < 1}
                        title={t('Start')}
                        aria-label={t('Start')}
                        onClick={() => void changeTasksState('start')}
                    >
                        <Play className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Start')}</span>
                    </button>
                    <button
                        type="button"
                        className={toolbarButtonClass}
                        disabled={selectedTasks.length < 1}
                        title={t('Pause')}
                        aria-label={t('Pause')}
                        onClick={() => void changeTasksState('pause')}
                    >
                        <Pause className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Pause')}</span>
                    </button>
                    <button
                        type="button"
                        className={toolbarButtonClass}
                        disabled={selectedTasks.length < 1}
                        title={t('Delete')}
                        aria-label={t('Delete')}
                        onClick={() => void removeTasks()}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Delete')}</span>
                    </button>
                    <button
                        type="button"
                        className={toolbarButtonClass + ' hidden min-[420px]:flex'}
                        disabled={tasks.length < 1}
                        title={t('Select All')}
                        aria-label={t('Select All')}
                        onClick={() => selectAll()}
                    >
                        <CheckSquare className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Select All')}</span>
                    </button>
                </div>

                <div className="ml-auto hidden items-center gap-2 sm:flex">
                    <input
                        ref={desktopSearchRef}
                        type="text"
                        className="w-40 rounded border border-white/20 bg-white/10 px-2 py-1 text-sm placeholder-white/60 focus:outline-none lg:w-56"
                        placeholder={t('Search')}
                        value={searchKeyword}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                    />
                </div>

                <button
                    type="button"
                    className={toolbarButtonClass + ' ml-auto sm:hidden'}
                    title={t('Search')}
                    aria-label={t('Search')}
                    aria-expanded={showMobileSearch}
                    onClick={() => setShowMobileSearch((value) => !value)}
                >
                    <Search className="h-4 w-4" aria-hidden="true" />
                </button>

                {showMobileSearch ? (
                    <div className="flex w-full items-center gap-1 sm:hidden">
                        <input
                            ref={mobileSearchRef}
                            type="text"
                            className="min-w-0 flex-1 rounded border border-white/20 bg-white/10 px-2 py-1 text-sm placeholder-white/60 focus:outline-none"
                            placeholder={t('Search')}
                            value={searchKeyword}
                            onChange={(event) => setSearchKeyword(event.target.value)}
                        />
                        <button
                            type="button"
                            className="flex items-center rounded px-2 py-1 hover:bg-white/10"
                            title={t('Close')}
                            aria-label={t('Close')}
                            onClick={() => setShowMobileSearch(false)}
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                ) : null}
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto p-4">{children}</main>

            <footer className="relative flex items-center justify-between bg-[#3c4852] px-3 py-1 text-xs text-white">
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
