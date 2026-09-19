import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import SettingsChoiceList from '@/components/settings/SettingsChoiceList';
import { useSettingStore } from '@/stores/settingStore';
import { getAriaNgSettingItem, getAriaNgSettingValue } from './ariaNgSettingItems';
import { setAriaNgSettingValue } from './ariaNgSettingValue';
import SettingsPage from './SettingsPage';

export default function AriaNgGeneralSettingValuePage({ settingKey }: { settingKey?: string }) {
    const { t } = useTranslation();
    const { item: itemParam } = useParams();
    const options = useSettingStore((state) => state.options);
    const item = getAriaNgSettingItem(settingKey ?? itemParam ?? '');

    if (!item || item.kind !== 'select' || !item.choices) {
        return (
            <SettingsPage>
                <div className="panel p-6 text-center text-sm text-gray-500">{t('No Data')}</div>
            </SettingsPage>
        );
    }

    const value = getAriaNgSettingValue(options, item);

    return (
        <SettingsPage>
            <SettingsChoiceList
                items={item.choices.map((choice) => ({
                    value: choice.value,
                    label: choice.label ?? t(choice.labelKey ?? '', choice.labelParams),
                }))}
                value={value}
                onSelect={(next) => setAriaNgSettingValue(item, next)}
            />
        </SettingsPage>
    );
}
