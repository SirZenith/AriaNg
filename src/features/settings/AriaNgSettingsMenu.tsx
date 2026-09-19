import { useTranslation } from 'react-i18next';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsItem from '@/components/settings/SettingsItem';
import { settingsSubItems } from './settingsCategories';

export default function AriaNgSettingsMenu() {
    const { t } = useTranslation();

    return (
        <SettingsCard>
            {settingsSubItems.ariang.map((item) => (
                <SettingsItem
                    key={item.key}
                    icon={item.icon}
                    label={t(item.label)}
                    indicator={{ type: 'navigate' }}
                    to={'/ariang/' + item.key}
                />
            ))}
        </SettingsCard>
    );
}
