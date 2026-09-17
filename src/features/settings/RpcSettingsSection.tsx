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

const inputClass =
    'w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:items-center">
            <label className="text-sm font-medium">{label}</label>
            <div className="sm:col-span-2">{children}</div>
        </div>
    );
}

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

    const applyAsDefault = (setting: AriaNgRpcSetting) => {
        if (setting.isDefault) {
            return;
        }

        setDefaultRpcSetting(setting);
        window.location.reload();
    };

    return (
        <div>
            <h3 className="mb-3 text-base font-semibold">{t('RPC Settings')}</h3>

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
                    <Field label={t('Aria2 RPC Alias')}>
                        <input
                            className={inputClass}
                            value={current.rpcAlias}
                            onChange={(event) => updateField('rpcAlias', event.target.value)}
                        />
                    </Field>
                    <Field label={t('Aria2 RPC Protocol')}>
                        <select
                            className={inputClass}
                            value={current.protocol}
                            onChange={(event) => updateField('protocol', event.target.value)}
                        >
                            <option value="http">http</option>
                            <option value="https">https</option>
                            <option value="ws">ws</option>
                            <option value="wss">wss</option>
                        </select>
                    </Field>
                    <Field label={t('Aria2 RPC Address')}>
                        <input
                            className={inputClass}
                            value={current.rpcHost}
                            onChange={(event) => updateField('rpcHost', event.target.value)}
                        />
                    </Field>
                    <Field label={t('Aria2 RPC Port')}>
                        <input
                            className={inputClass}
                            value={current.rpcPort}
                            onChange={(event) => updateField('rpcPort', event.target.value)}
                        />
                    </Field>
                    <Field label={t('Aria2 RPC Interface')}>
                        <input
                            className={inputClass}
                            value={current.rpcInterface}
                            onChange={(event) => updateField('rpcInterface', event.target.value)}
                        />
                    </Field>
                    <Field label={t('Aria2 RPC Secret Token')}>
                        <input
                            className={inputClass}
                            value={current.secret}
                            onChange={(event) => updateField('secret', event.target.value)}
                        />
                    </Field>
                    <Field label={t('Aria2 RPC Http Request Method')}>
                        <select
                            className={inputClass}
                            value={current.httpMethod}
                            onChange={(event) => updateField('httpMethod', event.target.value)}
                        >
                            <option value="POST">POST</option>
                            <option value="GET">GET</option>
                        </select>
                    </Field>
                    <Field label={t('Aria2 RPC Request Headers')}>
                        <textarea
                            className={inputClass + ' h-20'}
                            value={current.rpcRequestHeaders}
                            onChange={(event) => updateField('rpcRequestHeaders', event.target.value)}
                        />
                    </Field>

                    <div className="flex flex-wrap gap-2">
                        {!current.isDefault ? (
                            <>
                                <button
                                    type="button"
                                    className="rounded bg-[#3c8dbc] px-3 py-1.5 text-sm text-white"
                                    onClick={() => applyAsDefault(current)}
                                >
                                    {t('Activate')}
                                </button>
                                <button
                                    type="button"
                                    className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
                                    onClick={() => removeSetting(current)}
                                >
                                    {t('Remove')}
                                </button>
                            </>
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
