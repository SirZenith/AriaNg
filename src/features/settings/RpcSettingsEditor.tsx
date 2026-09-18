import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ExportCommandApiDialog, { type ExportCommandData } from '@/components/ExportCommandApiDialog';
import type { AriaNgRpcSetting } from '@/config/constants';
import {
    addNewRpcSetting,
    createRpcSetting,
    getAllRpcSettings,
    removeRpcSetting,
    setDefaultRpcSetting,
    updateRpcSetting,
} from '@/services/settingService';
import { reloadPage } from '@/utils/navigation';
import RpcSettingFields from './RpcSettingFields';

const rpcSettingFields: (keyof AriaNgRpcSetting)[] = [
    'rpcAlias',
    'rpcHost',
    'rpcPort',
    'rpcInterface',
    'protocol',
    'httpMethod',
    'rpcRequestHeaders',
    'secret',
];

export default function RpcSettingsEditor({ item }: { item: string }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isNew = item === 'new';
    const index = isNew ? -1 : Number(item);

    const existing = useMemo(() => (isNew ? undefined : getAllRpcSettings()[index]), [isNew, index]);
    const [draft, setDraft] = useState<AriaNgRpcSetting>(() => (existing ? { ...existing } : createRpcSetting()));
    const [exportOptions, setExportOptions] = useState<ExportCommandData | null>(null);

    const setField = (field: keyof AriaNgRpcSetting, value: string) => {
        setDraft((current) => ({ ...current, [field]: value }));
    };

    const save = () => {
        let target: AriaNgRpcSetting;

        if (isNew) {
            target = addNewRpcSetting();
        } else if (existing) {
            target = existing;
        } else {
            navigate('/settings/aria2/ariang/rpc');
            return;
        }

        for (const field of rpcSettingFields) {
            updateRpcSetting(target, field, String(draft[field] ?? ''));
        }

        if (!target.isDefault) {
            setDefaultRpcSetting(target);
        }

        reloadPage();
    };

    const remove = () => {
        if (!existing || existing.isDefault) {
            return;
        }

        const name = existing.rpcAlias || existing.rpcHost + ':' + existing.rpcPort;

        if (!window.confirm(t('Are you sure you want to remove rpc setting "{rpcName}"?', { rpcName: name }))) {
            return;
        }

        removeRpcSetting(existing);
        navigate('/settings/aria2/ariang/rpc');
    };

    return (
        <div className="flex flex-col gap-3">
            <RpcSettingFields setting={draft} onChange={setField} />

            <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded bg-[#3c8dbc] px-3 py-1.5 text-sm text-white" onClick={save}>
                    {t('Save')}
                </button>
                {existing && !existing.isDefault ? (
                    <button
                        type="button"
                        className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
                        onClick={remove}
                    >
                        {t('Remove')}
                    </button>
                ) : null}
                <button
                    type="button"
                    className="rounded bg-gray-500 px-3 py-1.5 text-sm text-white"
                    onClick={() => setExportOptions({ type: 'setting', data: draft })}
                >
                    {t('Export Command API')}
                </button>
            </div>

            {exportOptions ? (
                <ExportCommandApiDialog options={exportOptions} onClose={() => setExportOptions(null)} />
            ) : null}
        </div>
    );
}
