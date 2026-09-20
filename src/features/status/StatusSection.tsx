import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Power, RefreshCw, Save } from 'lucide-react';
import BottomBarButton from '@/components/BottomBarButton';
import SplitBottomBar from '@/components/SplitBottomBar';
import { aria2SettingService } from '@/services/aria2SettingService';
import { notifyInPage } from '@/services/notification';
import { useTaskStore } from '@/stores/taskStore';
import { formatVolume } from '@/utils/format';

interface VersionInfo {
    version?: string;
    enabledFeatures?: string[];
}

export default function StatusSection() {
    const { t } = useTranslation();
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const globalStat = useTaskStore((state) => state.globalStat);
    const rpcStatus = useTaskStore((state) => state.rpcStatus);

    useEffect(() => {
        void (async () => {
            const response = await aria2SettingService.getAria2Status(undefined, true);

            if (response.success && response.data) {
                setVersionInfo(response.data as VersionInfo);
            }
        })();
    }, []);

    const reconnect = () => {
        aria2SettingService.reconnect();
    };

    const saveSession = async () => {
        const response = await aria2SettingService.saveSession();

        if (response.success) {
            notifyInPage('', t('Save Session Succeeded'), { type: 'success' });
        }
    };

    const shutdown = async () => {
        if (!window.confirm(t('Are you sure you want to shutdown aria2?'))) {
            return;
        }

        const response = await aria2SettingService.shutdown();

        if (response.success) {
            notifyInPage('', t('Operation Succeeded'), { type: 'success' });
        }
    };

    return (
        <div className="p-4">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <dt className="text-xs text-gray-500">{t('Connection Status')}</dt>
                    <dd className="text-sm font-medium">{t(rpcStatus)}</dd>
                </div>
                <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <dt className="text-xs text-gray-500">{t('Aria2 Version')}</dt>
                    <dd className="text-sm font-medium">{versionInfo?.version || '-'}</dd>
                </div>
                <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <dt className="text-xs text-gray-500">{t('Downloading')}</dt>
                    <dd className="text-sm font-medium">{globalStat.numActive}</dd>
                </div>
                <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <dt className="text-xs text-gray-500">{t('Waiting')}</dt>
                    <dd className="text-sm font-medium">{globalStat.numWaiting}</dd>
                </div>
                <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <dt className="text-xs text-gray-500">{t('Download Speed')}</dt>
                    <dd className="text-sm font-medium">{formatVolume(globalStat.downloadSpeed) + '/s'}</dd>
                </div>
                <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <dt className="text-xs text-gray-500">{t('Upload Speed')}</dt>
                    <dd className="text-sm font-medium">{formatVolume(globalStat.uploadSpeed) + '/s'}</dd>
                </div>
            </dl>

            {versionInfo?.enabledFeatures ? (
                <div className="mt-4">
                    <h3 className="mb-1 text-sm font-semibold">{t('Enabled Features')}</h3>
                    <div className="flex flex-wrap gap-1">
                        {versionInfo.enabledFeatures.map((feature) => (
                            <span key={feature} className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            <SplitBottomBar
                leading={
                    <>
                        <BottomBarButton
                            ariaLabel={t('Reconnect')}
                            label={t('Reconnect')}
                            icon={RefreshCw}
                            iconClassName="text-primary dark:text-primary-light"
                            onClick={reconnect}
                        />
                        <BottomBarButton
                            ariaLabel={t('Save Session')}
                            label={t('Save Session')}
                            icon={Save}
                            iconClassName="text-green-600 dark:text-green-500"
                            onClick={() => void saveSession()}
                        />
                    </>
                }
                trailing={
                    <BottomBarButton
                        ariaLabel={t('Shutdown')}
                        label={t('Shutdown')}
                        icon={Power}
                        className="text-red-600 dark:text-red-400"
                        onClick={() => void shutdown()}
                    />
                }
                restrictWidth
            />
        </div>
    );
}
