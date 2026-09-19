import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsItem from '@/components/settings/SettingsItem';
import { getAllRpcSettings } from '@/services/settingService';
import BottomBar from '@/components/BottomBar';

export default function AriaNgRpcSettingsMenu() {
    const { t } = useTranslation();
    const settings = useMemo(() => getAllRpcSettings(), []);

    return (
        <>
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
            </div>

            <BottomBar>
                <div className="mb-2">
                    <Link
                        to="/ariang/rpc/new"
                        className="bottom-bar flex h-10 w-10 shrink-0 items-center justify-center p-0"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>
            </BottomBar>
        </>
    );
}
