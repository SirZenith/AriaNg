import { useTranslation } from 'react-i18next';
import SettingsChoiceList from '@/components/settings/SettingsChoiceList';
import type { Aria2OptionItem } from '@/services/aria2SettingService';

interface Aria2OptionValuePageProps {
    option: Aria2OptionItem;
    value: string;
    onChange: (key: string, value: string) => void;
}

export default function Aria2OptionValuePage({ option, value, onChange }: Aria2OptionValuePageProps) {
    const { t } = useTranslation();

    if (!option.options || option.options.length < 1) {
        return <div className="panel p-6 text-center text-sm text-gray-500">{t('No Data')}</div>;
    }

    return (
        <SettingsChoiceList
            items={option.options.map((item) => ({ value: item.value, label: t(item.name) }))}
            value={value}
            onSelect={(next) => onChange(option.key, next)}
        />
    );
}
