import { useTranslation } from 'react-i18next';
import Switch from '@/components/Switch';
import { useSettingStore } from '@/stores/settingStore';
import {
    ariaNgSettingItems,
    getAriaNgSettingValue,
    type AriaNgSettingChoice,
    type AriaNgSettingItem,
} from './ariaNgSettingItems';
import { setAriaNgSettingValue, toggleAriaNgSettingSwitch } from './ariaNgSettingValue';
import SettingsRow from './SettingsRow';

function getSettingLink(item: AriaNgSettingItem): string {
    return '/settings/aria2/ariang/settings/' + item.key;
}

export default function SettingsItemList() {
    const { t } = useTranslation();
    const options = useSettingStore((state) => state.options);

    const getChoiceLabel = (choice: AriaNgSettingChoice) =>
        choice.label ?? t(choice.labelKey ?? '', choice.labelParams);

    return (
        <div className="overflow-hidden rounded-xl bg-white shadow dark:bg-gray-800">
            {ariaNgSettingItems.map((item) => {
                const value = getAriaNgSettingValue(options, item);

                if (item.kind === 'select') {
                    const current = item.choices?.find((choice) => choice.value === value);

                    return (
                        <SettingsRow
                            key={item.key}
                            label={t(item.label)}
                            valueText={current ? getChoiceLabel(current) : value}
                            to={getSettingLink(item)}
                        />
                    );
                }

                if (item.kind === 'switch') {
                    return (
                        <SettingsRow key={item.key} label={t(item.label)}>
                            <Switch
                                checked={value === 'true'}
                                onChange={(checked) => toggleAriaNgSettingSwitch(item, checked)}
                                aria-label={t(item.label)}
                            />
                        </SettingsRow>
                    );
                }

                return (
                    <div
                        key={item.key}
                        className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-700"
                    >
                        <label htmlFor={'setting-' + item.key} className="mb-1 block text-sm font-medium">
                            {t(item.label)}
                        </label>
                        <input
                            id={'setting-' + item.key}
                            className="input"
                            value={value}
                            onChange={(event) => setAriaNgSettingValue(item, event.target.value)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
