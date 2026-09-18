import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ExportCommandApiDialog, { type ExportCommandData } from '@/components/ExportCommandApiDialog';
import type { AriaNgRpcSetting } from '@/config/constants';
import {
    addNewRpcSetting,
    getAllRpcSettings,
    removeRpcSetting,
    setDefaultRpcSetting,
    updateRpcSetting,
} from '@/services/settingService';
import { reloadPage } from '@/utils/navigation';
import RpcSettingFields from './RpcSettingFields';

export default function RpcSettingsSection() {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<AriaNgRpcSetting[]>(() => getAllRpcSettings());
    const [currentIndex, setCurrentIndex] = useState(() =>
        Math.max(
            0,
            getAllRpcSettings().findIndex((item) => item.isDefault),
        ),
    );
    const [needRefresh, setNeedRefresh] = useState(false);
    const [exportOptions, setExportOptions] = useState<ExportCommandData | null>(null);

    const current = settings[currentIndex];

    const updateField = (field: keyof AriaNgRpcSetting, value: string) => {
        if (!current) {
            return;
        }

        updateRpcSetting(current, field, value);
        setSettings([...getAllRpcSettings()]);
        setNeedRefresh(true);
    };

    const addSetting = () => {
        const created = addNewRpcSetting();
        const next = getAllRpcSettings();

        setSettings(next);
        setCurrentIndex(next.indexOf(created));
        setNeedRefresh(true);
    };

    const removeSetting = (setting: AriaNgRpcSetting) => {
        const name = setting.rpcAlias || setting.rpcHost + ':' + setting.rpcPort;

        if (!window.confirm(t('Are you sure you want to remove rpc setting "{rpcName}"?', { rpcName: name }))) {
            return;
        }

        removeRpcSetting(setting);
        setSettings(getAllRpcSettings());
        setCurrentIndex(0);
        setNeedRefresh(true);
    };

    const save = () => {
        if (!current) {
            return;
        }

        if (!current.isDefault) {
            setDefaultRpcSetting(current);
        }

        reloadPage();
    };

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
                {settings.map((setting, index) => (
                    <button
                        key={index}
                        type="button"
                        className={
                            'rounded px-2 py-1 text-sm ' +
                            (index === currentIndex ? 'bg-[#3c8dbc] text-white' : 'bg-gray-100 dark:bg-gray-700')
                        }
                        onClick={() => setCurrentIndex(index)}
                    >
                        {setting.rpcAlias || setting.rpcHost + ':' + setting.rpcPort}
                        {setting.isDefault ? ' *' : ''}
                    </button>
                ))}
                <button
                    type="button"
                    className="rounded bg-green-600 px-2 py-1 text-sm text-white"
                    onClick={addSetting}
                >
                    +
                </button>
            </div>

            {current ? (
                <div className="flex flex-col gap-3">
                    <RpcSettingFields setting={current} onChange={updateField} />

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="rounded bg-[#3c8dbc] px-3 py-1.5 text-sm text-white"
                            onClick={save}
                        >
                            {t('Save')}
                        </button>
                        {!current.isDefault ? (
                            <button
                                type="button"
                                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
                                onClick={() => removeSetting(current)}
                            >
                                {t('Remove')}
                            </button>
                        ) : null}
                        <button
                            type="button"
                            className="rounded bg-gray-500 px-3 py-1.5 text-sm text-white"
                            onClick={() => setExportOptions({ type: 'setting', data: current })}
                        >
                            {t('Export Command API')}
                        </button>
                    </div>

                    {needRefresh && !current.isDefault ? (
                        <p className="text-xs text-amber-600">
                            {t('Changes to the settings take effect after refreshing page.')}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {exportOptions ? (
                <ExportCommandApiDialog options={exportOptions} onClose={() => setExportOptions(null)} />
            ) : null}
        </div>
    );
}
