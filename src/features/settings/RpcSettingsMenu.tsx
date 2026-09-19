import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsItem from '@/components/settings/SettingsItem';
import { getAllRpcSettings } from '@/services/settingService';

export default function RpcSettingsMenu() {
    const { t } = useTranslation();
    const settings = useMemo(() => getAllRpcSettings(), []);

    return (
        <div className="flex flex-col gap-3">
            <SettingsCard>
                {settings.map((setting, index) => (
                    <SettingsItem
                        key={index}
                        label={
                            <span className="flex items-center gap-2">
                                <span className="min-w-0 truncate">
                                    {setting.rpcAlias || setting.rpcHost + ':' + setting.rpcPort}
                                </span>
                                {setting.isDefault ? (
                                    <span className="badge bg-primary px-1.5 text-[10px]">{t('Default')}</span>
                                ) : null}
                            </span>
                        }
                        indicator={{ type: 'navigate' }}
                        to={'/ariang/rpc/' + index}
                    />
                ))}
            </SettingsCard>

            <Link
                to="/ariang/rpc/new"
                className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
            >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('Add New RPC Setting')}
            </Link>
        </div>
    );
}
