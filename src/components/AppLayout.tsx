import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
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
    useTheme
} from '@/hooks/useAria2';
import { useMonitorStore } from '@/services/monitor';
import { getAllRpcSettings, isEnableDebugMode, setDefaultRpcSetting } from '@/services/settingService';
import { aria2TaskService } from '@/services/taskService';
import { getBuildVersion } from '@/services/version';
import { useSettingStore } from '@/stores/settingStore';
import { useTaskStore } from '@/stores/taskStore';
import { formatVolume } from '@/utils/format';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
    'flex items-center gap-2 rounded px-3 py-2 text-sm ' +
    (isActive ? 'bg-[#3c8dbc] text-white' : 'text-gray-200 hover:bg-white/10');

export default function AppLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const searchRef = useRef<HTMLInputElement>(null);
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

    useKeyboardShortcuts({
        selectAll: () => selectAll(),
        delete: () => {
            void removeTasks();
        },
        find: () => searchRef.current?.focus()
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
        'Waiting to reconnect': 'bg-gray-500'
    };

    return (
        <div className="flex h-full flex-col">
            <header className="flex flex-wrap items-center gap-3 bg-[#3c4852] px-3 py-2 text-white">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <span title={'AriaNg ' + getBuildVersion()}>AriaNg</span>
                    <select
                        className="rounded border border-white/30 bg-[#3c4852] px-1 py-0.5 text-xs"
                        value={rpcSettings.findIndex((item) => item.isDefault)}
                        onChange={(event) => changeRpc(Number(event.target.value))}
                        title="RPC"
                    >
                        {rpcSettings.map((item, index) => (
                            <option key={index} value={index}>
                                {item.rpcAlias || item.rpcHost + ':' + item.rpcPort}
                                {item.protocol === 'ws' || item.protocol === 'wss' ? ' (WS)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                    <Link to="/new" className="rounded px-2 py-1 text-sm hover:bg-white/10" title={t('New')}>
                        <span className="mr-1">+</span>
                        {t('New')}
                    </Link>
                    <button
                        type="button"
                        className="rounded px-2 py-1 text-sm hover:bg-white/10 disabled:opacity-40"
                        disabled={selectedTasks.length < 1}
                        title={t('Start')}
                        onClick={() => void changeTasksState('start')}
                    >
                        {t('Start')}
                    </button>
                    <button
                        type="button"
                        className="rounded px-2 py-1 text-sm hover:bg-white/10 disabled:opacity-40"
                        disabled={selectedTasks.length < 1}
                        title={t('Pause')}
                        onClick={() => void changeTasksState('pause')}
                    >
                        {t('Pause')}
                    </button>
                    <button
                        type="button"
                        className="rounded px-2 py-1 text-sm hover:bg-white/10 disabled:opacity-40"
                        disabled={selectedTasks.length < 1}
                        title={t('Delete')}
                        onClick={() => void removeTasks()}
                    >
                        {t('Delete')}
                    </button>
                    <button
                        type="button"
                        className="rounded px-2 py-1 text-sm hover:bg-white/10 disabled:opacity-40"
                        disabled={tasks.length < 1}
                        title={t('Select All')}
                        onClick={() => selectAll()}
                    >
                        {t('Select All')}
                    </button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <input
                        ref={searchRef}
                        type="text"
                        className="w-48 rounded border border-white/20 bg-white/10 px-2 py-1 text-sm placeholder-white/60 focus:outline-none"
                        placeholder={t('Search')}
                        value={searchKeyword}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                    />
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                <aside className="w-52 shrink-0 overflow-y-auto bg-[#222d32] p-2">
                    <div className="px-3 py-1 text-xs uppercase tracking-wide text-gray-500">{t('Download')}</div>
                    <nav className="flex flex-col gap-1">
                        <NavLink to="/downloading" className={navItemClass}>
                            {t('Downloading')}
                            {globalStat.numActive > 0 ? ` (${globalStat.numActive})` : ''}
                        </NavLink>
                        <NavLink to="/waiting" className={navItemClass}>
                            {t('Waiting')}
                            {globalStat.numWaiting > 0 ? ` (${globalStat.numWaiting})` : ''}
                        </NavLink>
                        <NavLink to="/stopped" className={navItemClass}>
                            {t('Finished / Stopped')}
                            {globalStat.numStopped > 0 ? ` (${globalStat.numStopped})` : ''}
                        </NavLink>
                    </nav>

                    <div className="mt-4 px-3 py-1 text-xs uppercase tracking-wide text-gray-500">{t('Settings')}</div>
                    <nav className="flex flex-col gap-1">
                        <NavLink to="/settings/ariang" className={navItemClass}>
                            {t('AriaNg Settings')}
                        </NavLink>
                        <NavLink to="/settings/aria2/basic" className={navItemClass}>
                            {t('Aria2 Settings')}
                        </NavLink>
                    </nav>

                    <div className="mt-4 px-3 py-1 text-xs uppercase tracking-wide text-gray-500">{t('Aria2 Status')}</div>
                    <nav className="flex flex-col gap-1">
                        <NavLink to="/status" className={navItemClass}>
                            {t('Aria2 Status')}
                        </NavLink>
                        {debugMode ? (
                            <NavLink to="/debug" className={navItemClass}>
                                {t('AriaNg Debug Console')}
                            </NavLink>
                        ) : null}
                    </nav>
                </aside>

                <main className="min-w-0 flex-1 overflow-y-auto p-4">{children}</main>
            </div>

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

            <NotificationContainer />

            {quickSetting ? (
                <QuickSettingDialog type="globalSpeedLimit" title="Global Rate Limit" onClose={() => setQuickSetting(false)} />
            ) : null}
        </div>
    );
}
