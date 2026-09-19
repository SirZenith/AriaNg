import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ExportCommandApiDialog, { type ExportCommandData } from '@/components/ExportCommandApiDialog';
import type { AriaNgRpcSetting } from '@/config/constants';
import {
    addNewRpcSetting,
    getAllRpcSettings,
    removeRpcSetting,
    setDefaultRpcSettingByIndex,
    updateRpcSetting,
} from '@/services/settingService';
import { createRpcDraft, useRpcDraftStore } from '@/stores/rpcDraftStore';
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
    const storedDraft = useRpcDraftStore((state) => state.drafts[item]);
    const setDraftField = useRpcDraftStore((state) => state.setField);
    const clearDraft = useRpcDraftStore((state) => state.clearDraft);
    const fallbackDraft = useMemo(() => createRpcDraft(item), [item]);
    const draft = storedDraft ?? fallbackDraft;
    const [exportOptions, setExportOptions] = useState<ExportCommandData | null>(null);

    const setField = (field: keyof AriaNgRpcSetting, value: string) => {
        setDraftField(item, field, value);
    };

    const save = () => {
        if (isNew) {
            const newIndex = addNewRpcSetting();

            for (const field of rpcSettingFields) {
                updateRpcSetting(newIndex, field, String(draft[field] ?? ''));
            }

            setDefaultRpcSettingByIndex(newIndex);
            clearDraft(item);
            reloadPage();
            return;
        }

        if (!existing) {
            clearDraft(item);
            navigate('/ariang/rpc');
            return;
        }

        for (const field of rpcSettingFields) {
            updateRpcSetting(index, field, String(draft[field] ?? ''));
        }

        if (!existing.isDefault) {
            setDefaultRpcSettingByIndex(index);
        }

        clearDraft(item);
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

        clearDraft(item);
        removeRpcSetting(index);
        navigate('/ariang/rpc');
    };

    return (
        <div className="flex flex-col gap-3">
            <RpcSettingFields setting={draft} rpcItem={item} onChange={setField} />

            <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={save}>
                    {t('Save')}
                </button>
                {existing && !existing.isDefault ? (
                    <button type="button" className="btn btn-danger btn-sm" onClick={remove}>
                        {t('Remove')}
                    </button>
                ) : null}
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
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
