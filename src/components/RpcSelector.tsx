import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllRpcSettings, setDefaultRpcSettingByIndex } from '@/services/settingService';
import { getBuildVersion } from '@/services/version';
import { reloadPage } from '@/utils/navigation';

export default function RpcSelector({ compact = false }: { compact?: boolean }) {
    const { t } = useTranslation();
    const rpcSettings = useMemo(() => getAllRpcSettings(), []);

    const changeRpc = (index: number) => {
        const settings = getAllRpcSettings();
        const target = settings[index];

        if (!target || target.isDefault) {
            return;
        }

        setDefaultRpcSettingByIndex(index);
        reloadPage();
    };

    return (
        <div className={compact ? 'flex min-w-0 items-center' : 'flex min-w-0 flex-1 items-center gap-2'}>
            {compact ? null : (
                <>
                    <span className="text-base font-semibold sm:text-lg" title={'AriaNg ' + getBuildVersion()}>
                        AriaNg
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-white/70">{t('Server:')}</span>
                </>
            )}
            <select
                className={
                    'truncate rounded border border-white/30 bg-[#3c4852] px-1 py-0.5 text-xs ' +
                    (compact ? 'max-w-[8rem]' : 'max-w-[5.5rem] sm:max-w-[14rem]')
                }
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
    );
}
