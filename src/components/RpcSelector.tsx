import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllRpcSettings, setDefaultRpcSetting } from '@/services/settingService';
import { getBuildVersion } from '@/services/version';

export default function RpcSelector() {
    const { t } = useTranslation();
    const rpcSettings = useMemo(() => getAllRpcSettings(), []);

    const changeRpc = (index: number) => {
        const settings = getAllRpcSettings();
        const target = settings[index];

        if (!target || target.isDefault) {
            return;
        }

        setDefaultRpcSetting(target);
        window.location.reload();
    };

    return (
        <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-base font-semibold sm:text-lg" title={'AriaNg ' + getBuildVersion()}>
                AriaNg
            </span>
            <span className="ml-auto shrink-0 text-xs text-white/70">{t('Server:')}</span>
            <select
                className="max-w-[5.5rem] truncate rounded border border-white/30 bg-[#3c4852] px-1 py-0.5 text-xs sm:max-w-[14rem]"
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
