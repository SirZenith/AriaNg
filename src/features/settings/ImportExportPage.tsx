import { useTranslation } from 'react-i18next';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsPage from './SettingsPage';
import { resetOptions } from '@/services/settingService';
import ImportExportSection from '@/features/settings/ImportExportSection';

export default function ImportExportPage() {
    const { t } = useTranslation();
    const title = t('Import / Export AriaNg Settings');

    const resetAll = () => {
        if (!window.confirm(t('Are you sure you want to reset all settings?'))) {
            return;
        }

        resetOptions();
        window.location.reload();
    };

    return (
        <SettingsPage>
            <SettingsSection title={title}>
                <div className="p-4">
                    <ImportExportSection onReset={resetAll} />
                </div>
            </SettingsSection>
        </SettingsPage>
    );
}
