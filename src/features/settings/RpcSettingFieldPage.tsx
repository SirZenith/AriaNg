import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import SettingsChoiceList from '@/components/settings/SettingsChoiceList';
import { createRpcDraft, useRpcDraftStore } from '@/stores/rpcDraftStore';
import { getRpcSettingFieldItem } from './rpcSettingFieldItems';
import SettingsPage from './SettingsPage';

interface RpcSettingFieldPageProps {
    rpcItem?: string;
    field?: string;
}

export default function RpcSettingFieldPage({ rpcItem, field }: RpcSettingFieldPageProps) {
    const { t } = useTranslation();
    const params = useParams();
    const item = rpcItem ?? params.item ?? '';
    const fieldKey = field ?? params.field ?? '';
    const storedDraft = useRpcDraftStore((state) => state.drafts[item]);
    const setField = useRpcDraftStore((state) => state.setField);
    const fieldItem = getRpcSettingFieldItem(fieldKey);

    if (!fieldItem) {
        return (
            <SettingsPage>
                <div className="panel p-6 text-center text-sm text-gray-500">{t('No Data')}</div>
            </SettingsPage>
        );
    }

    const draft = storedDraft ?? createRpcDraft(item);
    const value = String(draft[fieldItem.key] ?? '');

    return (
        <SettingsPage>
            <SettingsChoiceList
                items={fieldItem.choices.map((choice) => ({ value: choice, label: choice }))}
                value={value}
                onSelect={(next) => setField(item, fieldItem.key, next)}
            />
        </SettingsPage>
    );
}
