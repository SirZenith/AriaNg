import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsCard from '@/components/settings/SettingsCard';
import { aria2SettingService } from '@/services/aria2SettingService';
import { getCurrentRpcDisplayName } from '@/services/settingService';
import { useTaskStore } from '@/stores/taskStore';
import { formatVolume } from '@/utils/format';

interface Aria2VersionInfo {
    version?: string;
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className="truncate text-sm font-medium" title={value}>
                {value}
            </div>
        </div>
    );
}

export default function RpcConnectionCard() {
    const { t } = useTranslation();
    const rpcStatus = useTaskStore((state) => state.rpcStatus);
    const globalStat = useTaskStore((state) => state.globalStat);
    const [aria2Version, setAria2Version] = useState('');

    useEffect(() => {
        void (async () => {
            const response = await aria2SettingService.getAria2Status(undefined, true);

            if (response.success && response.data) {
                setAria2Version((response.data as Aria2VersionInfo).version || '');
            }
        })();
    }, []);

    const rpcDisplayName = getCurrentRpcDisplayName();

    return (
        <SettingsCard className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">{t('Connection Status')}</span>
                <span className="badge bg-success">{t(rpcStatus)}</span>
            </div>

            <div className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400" title={rpcDisplayName}>
                {rpcDisplayName}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatItem label={t('Aria2 Version')} value={aria2Version || '-'} />
                <StatItem label={t('Downloading')} value={String(globalStat.numActive)} />
                <StatItem label={t('Waiting')} value={String(globalStat.numWaiting)} />
                <StatItem label={t('Finished / Stopped')} value={String(globalStat.numStopped)} />
                <StatItem label={t('Download Speed')} value={formatVolume(globalStat.downloadSpeed) + '/s'} />
                <StatItem label={t('Upload Speed')} value={formatVolume(globalStat.uploadSpeed) + '/s'} />
            </dl>
        </SettingsCard>
    );
}
