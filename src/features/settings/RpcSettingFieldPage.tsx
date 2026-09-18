import { useTranslation } from 'react-i18next';
import { createRpcDraft, useRpcDraftStore } from '@/stores/rpcDraftStore';
import { getRpcSettingFieldItem } from './rpcSettingFieldItems';
import OptionChoiceList from './OptionChoiceList';

interface RpcSettingFieldPageProps {
    rpcItem: string;
    field: string;
}

export default function RpcSettingFieldPage({ rpcItem, field }: RpcSettingFieldPageProps) {
    const { t } = useTranslation();
    const storedDraft = useRpcDraftStore((state) => state.drafts[rpcItem]);
    const setField = useRpcDraftStore((state) => state.setField);
    const fieldItem = getRpcSettingFieldItem(field);

    if (!fieldItem) {
        return <div className="panel p-6 text-center text-sm text-gray-500">{t('No Data')}</div>;
    }

    const draft = storedDraft ?? createRpcDraft(rpcItem);
    const value = String(draft[fieldItem.key] ?? '');

    return (
        <OptionChoiceList
            items={fieldItem.choices.map((choice) => ({ value: choice, label: choice }))}
            value={value}
            onSelect={(next) => setField(rpcItem, fieldItem.key, next)}
        />
    );
}
