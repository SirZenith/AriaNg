import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsChoiceModal from '@/components/settings/SettingsChoiceModal';
import SettingsInputModal from '@/components/settings/SettingsInputModal';
import SettingsItem from '@/components/settings/SettingsItem';
import type { Aria2OptionItem } from '@/services/aria2SettingService';
import { getSettingHistory } from '@/services/settingService';
import { toAria2ItemView } from './settingsItemViews';

interface Aria2OptionItemListProps {
    options: Aria2OptionItem[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    routeBase?: string;
}

export default function Aria2OptionItemList({ options, values, onChange, routeBase }: Aria2OptionItemListProps) {
    const { t } = useTranslation();
    const [inputOption, setInputOption] = useState<Aria2OptionItem | null>(null);
    const [choiceOption, setChoiceOption] = useState<Aria2OptionItem | null>(null);

    const views = options.map((option) => {
        const value = values[option.key] ?? option.defaultValue ?? '';

        return toAria2ItemView(option, value, t, {
            toValuePage: routeBase ? (key) => routeBase + '/' + key : undefined,
            onRequestChoice: setChoiceOption,
            onRequestInput: setInputOption,
            onToggle: (key, checked) => onChange(key, checked ? 'true' : 'false'),
        });
    });

    return (
        <>
            {views.map(({ key, ...props }) => (
                <SettingsItem key={key} {...props} />
            ))}

            {inputOption ? (
                <SettingsInputModal
                    title={t(inputOption.nameKey)}
                    value={values[inputOption.key] ?? inputOption.defaultValue ?? ''}
                    inputType={inputOption.type === 'integer' || inputOption.type === 'float' ? 'number' : 'text'}
                    history={inputOption.showHistory ? getSettingHistory(inputOption.key) : []}
                    required={inputOption.required}
                    suffix={inputOption.suffix}
                    onConfirm={(value) => onChange(inputOption.key, value)}
                    onClose={() => setInputOption(null)}
                />
            ) : null}

            {choiceOption ? (
                <SettingsChoiceModal
                    title={t(choiceOption.nameKey)}
                    items={(choiceOption.options ?? []).map((item) => ({ value: item.value, label: t(item.name) }))}
                    value={values[choiceOption.key] ?? choiceOption.defaultValue ?? ''}
                    onSelect={(value) => onChange(choiceOption.key, value)}
                    onClose={() => setChoiceOption(null)}
                />
            ) : null}
        </>
    );
}
