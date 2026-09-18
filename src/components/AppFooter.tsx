import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QuickSettingDialog from './QuickSettingDialog';
import SpeedChart from './SpeedChart';
import { useMonitorStore } from '@/services/monitor';
import { useTaskStore } from '@/stores/taskStore';
import { formatVolume } from '@/utils/format';

const statusLabelClass: Record<string, string> = {
    Connected: 'bg-green-600',
    Connecting: 'bg-blue-600',
    Reconnecting: 'bg-blue-600',
    Disconnected: 'bg-red-600',
    'Waiting to reconnect': 'bg-gray-500',
};

export default function AppFooter() {
    const { t } = useTranslation();
    const [showChart, setShowChart] = useState(false);
    const [quickSetting, setQuickSetting] = useState(false);

    const rpcStatus = useTaskStore((state) => state.rpcStatus);
    const globalStat = useTaskStore((state) => state.globalStat);
    const globalStats = useMonitorStore((state) => state.globalStats);

    return (
        <>
            <div className="relative mx-auto flex w-full max-w-[1000px] items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`badge ${statusLabelClass[rpcStatus] || 'bg-gray-500'}`}>{t(rpcStatus)}</span>
                    <button
                        type="button"
                        className="toolbar-btn"
                        title={t('Global Rate Limit')}
                        onClick={() => setQuickSetting(true)}
                    >
                        {t('Global Rate Limit')}
                    </button>
                </div>
                <button
                    type="button"
                    className="toolbar-btn gap-4"
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
                    <div className="popover absolute right-2 bottom-full z-40 w-80 p-2">
                        <SpeedChart data={globalStats} height={120} />
                    </div>
                ) : null}
            </div>

            {quickSetting ? (
                <QuickSettingDialog
                    type="globalSpeedLimit"
                    title="Global Rate Limit"
                    onClose={() => setQuickSetting(false)}
                />
            ) : null}
        </>
    );
}
