import { useTranslation } from 'react-i18next';
import SettingsSection from '@/components/settings/SettingsSection';
import StatusSection from '@/features/status/StatusSection';
import SettingsPage from './SettingsPage';
import { getSettingsCategory } from './settingsCategories';

export default function StatusPage() {
    const { t } = useTranslation();
    const label = getSettingsCategory('status')?.label;

    return (
        <SettingsPage>
            <SettingsSection title={label ? t(label) : undefined}>
                <StatusSection />
            </SettingsSection>
        </SettingsPage>
    );
}
