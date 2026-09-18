import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsSection from '@/components/settings/SettingsSection';
import { aria2SettingService } from '@/services/aria2SettingService';
import Aria2OptionItemList from './Aria2OptionItemList';
import { protocolCategories } from './protocolCategories';
import SettingsPage from './SettingsPage';
import useAria2GlobalOptions from './useAria2GlobalOptions';

interface ProtocolOptionSectionProps {
    category: string;
    title: string;
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

function ProtocolOptionSection({ category, title, values, onChange }: ProtocolOptionSectionProps) {
    const optionItems = useMemo(() => {
        const keys = aria2SettingService.getAvailableGlobalOptionsKeys(category);

        return Array.isArray(keys) ? aria2SettingService.getSpecifiedOptions(keys) : [];
    }, [category]);

    return (
        <SettingsSection title={title}>
            <Aria2OptionItemList
                routeBase={'/settings/protocol/' + category}
                options={optionItems}
                values={values}
                onChange={onChange}
            />
        </SettingsSection>
    );
}

export default function ProtocolSettingsPage() {
    const { t } = useTranslation();
    const { globalOptions, loading, changeOption } = useAria2GlobalOptions();

    if (loading) {
        return (
            <SettingsPage>
                <SettingsCard>
                    <div className="p-6 text-center text-sm text-gray-500">{t('Loading')}</div>
                </SettingsCard>
            </SettingsPage>
        );
    }

    return (
        <SettingsPage>
            {protocolCategories.map((category) => (
                <ProtocolOptionSection
                    key={category.key}
                    category={category.key}
                    title={t(category.label)}
                    values={globalOptions}
                    onChange={(key, value) => void changeOption(key, value)}
                />
            ))}
        </SettingsPage>
    );
}
