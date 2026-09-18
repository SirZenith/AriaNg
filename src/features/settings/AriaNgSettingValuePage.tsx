import { useTranslation } from 'react-i18next';
import { useSettingStore } from '@/stores/settingStore';
import { getAriaNgSettingItem, getAriaNgSettingValue } from './ariaNgSettingItems';
import { setAriaNgSettingValue } from './ariaNgSettingValue';
import OptionChoiceList from './OptionChoiceList';

export default function AriaNgSettingValuePage({ settingKey }: { settingKey: string }) {
    const { t } = useTranslation();
    const options = useSettingStore((state) => state.options);
    const item = getAriaNgSettingItem(settingKey);

    if (!item || item.kind !== 'select' || !item.choices) {
        return <div className="panel p-6 text-center text-sm text-gray-500">{t('No Data')}</div>;
    }

    const value = getAriaNgSettingValue(options, item);

    return (
        <OptionChoiceList
            items={item.choices.map((choice) => ({
                value: choice.value,
                label: choice.label ?? t(choice.labelKey ?? '', choice.labelParams),
            }))}
            value={value}
            onSelect={(next) => setAriaNgSettingValue(item, next)}
        />
    );
}
