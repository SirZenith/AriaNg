import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsSection from '@/components/settings/SettingsSection';
import { aria2SettingService } from '@/services/aria2SettingService';
import Aria2OptionItemList from './Aria2OptionItemList';
import useAria2GlobalOptions from './useAria2GlobalOptions';

interface Aria2OptionListPageProps {
    category: string;
    routeBase: string;
    title?: string;
}

export default function Aria2OptionListPage({ category, routeBase, title }: Aria2OptionListPageProps) {
    const { t } = useTranslation();
    const { globalOptions, loading, changeOption } = useAria2GlobalOptions();

    const optionItems = useMemo(() => {
        const keys = aria2SettingService.getAvailableGlobalOptionsKeys(category);

        return Array.isArray(keys) ? aria2SettingService.getSpecifiedOptions(keys) : [];
    }, [category]);

    if (loading) {
        return (
            <SettingsCard>
                <div className="p-6 text-center text-sm text-gray-500">{t('Loading')}</div>
            </SettingsCard>
        );
    }

    return (
        <SettingsSection title={title}>
            <Aria2OptionItemList
                routeBase={routeBase}
                options={optionItems}
                values={globalOptions}
                onChange={(key, value) => void changeOption(key, value)}
            />
        </SettingsSection>
    );
}
