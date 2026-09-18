import { type ReactNode } from 'react';
import BottomNav from './BottomNav';
import NotificationContainer from './NotificationContainer';
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
    useLanguageSync();
    useTheme();
    useRpcConnectionWatcher();
    useGlobalStatPolling();
    useDynamicTitle();
    useBrowserNotificationEvents();

    const globalStat = useTaskStore((state) => state.globalStat);

    const debugMode = isEnableDebugMode();

    return (
        <div className="flex h-full flex-col">
            <main
                data-scroll-container
                className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 scrollbar-gutter-both"
            >
                <div className="mx-auto w-full max-w-250">{children}</div>
            </main>

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
