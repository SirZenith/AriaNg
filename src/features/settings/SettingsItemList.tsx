import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsInputModal from '@/components/settings/SettingsInputModal';
import SettingsItem from '@/components/settings/SettingsItem';
import { useSettingStore } from '@/stores/settingStore';
import { ariaNgSettingItems, getAriaNgSettingValue, type AriaNgSettingItem } from './ariaNgSettingItems';
import { setAriaNgSettingValue, toggleAriaNgSettingSwitch } from './ariaNgSettingValue';
import { toAriaNgItemView } from './settingsItemViews';

export default function SettingsItemList() {
    const { t } = useTranslation();
    const options = useSettingStore((state) => state.options);
    const [inputItem, setInputItem] = useState<AriaNgSettingItem | null>(null);

    const views = ariaNgSettingItems.map((item) =>
        toAriaNgItemView(item, options, t, {
            toValuePage: (key) => '/settings/ariang/settings/' + key,
            onRequestInput: setInputItem,
            onToggle: (target, checked) => toggleAriaNgSettingSwitch(target, checked),
        }),
    );

    return (
        <>
            {views.map(({ key, ...props }) => (
                <SettingsItem key={key} {...props} />
            ))}

            {inputItem ? (
                <SettingsInputModal
                    title={t(inputItem.label)}
                    value={getAriaNgSettingValue(options, inputItem)}
                    onConfirm={(value) => setAriaNgSettingValue(inputItem, value)}
                    onClose={() => setInputItem(null)}
                />
            ) : null}
        </>
    );
}
