import { useEffect } from 'react';
import i18n, { ensureLanguageResources } from '@/i18n';
import {
    getDownloadTaskRefreshInterval,
    getGlobalStatRefreshInterval,
    getKeyboardShortcuts,
    getTitle,
    isBrowserSupportDarkMode,
} from '@/services/settingService';
import { aria2SettingService } from '@/services/aria2SettingService';
import { notifyBtTaskComplete, notifyTaskComplete, notifyTaskError } from '@/services/browserNotification';
import { useMonitorStore } from '@/services/monitor';
import { aria2TaskService } from '@/services/taskService';
import { useSettingStore } from '@/stores/settingStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Aria2Task } from '@/types/aria2';
import { extendArray } from '@/utils/common';
import { formatVolume } from '@/utils/format';
import { processDownloadTask } from '@/utils/task';

export function useRpcConnectionWatcher(): void {
    const setRpcStatus = useTaskStore((state) => state.setRpcStatus);

    useEffect(() => {
        aria2TaskService.onConnectionSuccess(() => setRpcStatus('Connected'));
        aria2TaskService.onConnectionFailed(() => setRpcStatus('Disconnected'));
        aria2TaskService.onConnectionReconnecting(() => setRpcStatus('Reconnecting'));
        aria2TaskService.onConnectionWaitingToReconnect(() => setRpcStatus('Waiting to reconnect'));
    }, [setRpcStatus]);
}

export function useBrowserNotificationEvents(): void {
    useEffect(() => {
        aria2TaskService.onTaskCompleted((context) => {
            notifyTaskComplete((context as { task?: Aria2Task | null } | null)?.task ?? null);
        });
        aria2TaskService.onBtTaskCompleted((context) => {
            notifyBtTaskComplete((context as { task?: Aria2Task | null } | null)?.task ?? null);
        });
        aria2TaskService.onTaskErrorOccur((context) => {
            notifyTaskError((context as { task?: Aria2Task | null } | null)?.task ?? null);
        });
    }, []);
}

export function useTaskListPolling(location: string): void {
    const setTasks = useTaskStore((state) => state.setTasks);

    useEffect(() => {
        let cancelled = false;
        let needRequestWholeInfo = true;

        const refresh = async (silent: boolean) => {
            if (useTaskStore.getState().pollingPaused) {
                return;
            }

            const response = await aria2TaskService.getTaskList(location, needRequestWholeInfo, undefined, silent);

            if (cancelled || !response || !response.success || !Array.isArray(response.data)) {
                return;
            }

            const taskList = response.data as Aria2Task[];
            const current = useTaskStore.getState().tasks;

            if (needRequestWholeInfo || current.length !== taskList.length || !extendArray(taskList, current, 'gid')) {
                setTasks(taskList.map((task) => processDownloadTask(task)));
                needRequestWholeInfo = false;
            } else {
                setTasks([...current]);
            }
        };

        void refresh(false);

        const interval = getDownloadTaskRefreshInterval();

        if (interval <= 0) {
            return () => {
                cancelled = true;
            };
        }

        const timer = window.setInterval(() => {
            void refresh(true);
        }, interval);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [location, setTasks]);
}

export function useGlobalStatPolling(): void {
    const setGlobalStat = useTaskStore((state) => state.setGlobalStat);
    const recordGlobalStat = useMonitorStore((state) => state.recordGlobalStat);

    useEffect(() => {
        let cancelled = false;

        const refresh = async () => {
            const response = await aria2SettingService.getGlobalStat();

            if (cancelled || !response || !response.success || !response.data) {
                return;
            }

            const data = response.data as Record<string, string>;
            const stat = {
                downloadSpeed: parseInt(data.downloadSpeed || '0'),
                uploadSpeed: parseInt(data.uploadSpeed || '0'),
                numActive: parseInt(data.numActive || '0'),
                numWaiting: parseInt(data.numWaiting || '0'),
                numStopped: parseInt(data.numStopped || '0'),
            };

            setGlobalStat(stat);
            recordGlobalStat(stat);
        };

        void refresh();

        const interval = getGlobalStatRefreshInterval();

        if (interval <= 0) {
            return () => {
                cancelled = true;
            };
        }

        const timer = window.setInterval(() => {
            void refresh();
        }, interval);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [setGlobalStat, recordGlobalStat]);
}

export function useLanguageSync(): void {
    const language = useSettingStore((state) => state.options.language);

    useEffect(() => {
        void (async () => {
            await ensureLanguageResources(language);
            await i18n.changeLanguage(language);
        })();
    }, [language]);
}

export function useTheme(): void {
    const theme = useSettingStore((state) => state.options.theme);

    useEffect(() => {
        const applyTheme = () => {
            let dark = false;

            if (theme === 'dark') {
                dark = true;
            } else if (theme === 'system') {
                dark = isBrowserSupportDarkMode() && window.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            document.body.classList.toggle('theme-dark', dark);
        };

        applyTheme();

        if (theme === 'system' && isBrowserSupportDarkMode()) {
            const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
            matchMedia.addEventListener('change', applyTheme);

            return () => matchMedia.removeEventListener('change', applyTheme);
        }

        return undefined;
    }, [theme]);
}

export function useDynamicTitle(): void {
    const downloadSpeed = useTaskStore((state) => state.globalStat.downloadSpeed);
    const uploadSpeed = useTaskStore((state) => state.globalStat.uploadSpeed);
    const taskCount = useTaskStore((state) => state.tasks.length);

    useEffect(() => {
        const title = getTitle()
            .replace(/\$\{downspeed\}/g, formatVolume(downloadSpeed) + '/s')
            .replace(/\$\{upspeed\}/g, formatVolume(uploadSpeed) + '/s')
            .replace(/\$\{title\}/g, 'AriaNg')
            .replace(/\$\{downloadTaskCount\}/g, String(taskCount));

        document.title = title;
    }, [downloadSpeed, uploadSpeed, taskCount]);
}

export interface KeyboardActions {
    selectAll?: () => void;
    delete?: () => void;
    find?: () => void;
}

export function useKeyboardShortcuts(actions: KeyboardActions): void {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (!getKeyboardShortcuts()) {
                return;
            }

            const target = event.target as HTMLElement | null;
            const isTextbox = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
            const withCtrl = event.ctrlKey || event.metaKey;

            if (withCtrl && event.key.toLowerCase() === 'a' && !isTextbox) {
                event.preventDefault();
                actions.selectAll?.();
            } else if (withCtrl && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                actions.find?.();
            } else if (event.key === 'Delete' && !isTextbox) {
                actions.delete?.();
            }
        };

        window.addEventListener('keydown', handler, true);

        return () => window.removeEventListener('keydown', handler, true);
    }, [actions]);
}
