import { type ReactNode } from 'react';
import NotificationContainer from './NotificationContainer';
import { BarHost, PanelBarProvider } from './PanelBar';
import {
    useBrowserNotificationEvents,
    useDynamicTitle,
    useGlobalStatPolling,
    useLanguageSync,
    useRpcConnectionWatcher,
    useTheme,
} from '@/hooks/useAria2';

export default function AppLayout({ children }: { children: ReactNode }) {
    useLanguageSync();
    useTheme();
    useRpcConnectionWatcher();
    useGlobalStatPolling();
    useDynamicTitle();
    useBrowserNotificationEvents();

    return (
        <PanelBarProvider>
            <div className="relative flex h-full flex-col">
                <BarHost slot="top" />

                <main
                    data-scroll-container
                    className="app-scroll-container min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-0 scrollbar-gutter-both"
                >
                    <div className="mx-auto w-full max-w-250">{children}</div>
                </main>

                <BarHost slot="bottom" />

                <NotificationContainer />
            </div>
        </PanelBarProvider>
    );
}
