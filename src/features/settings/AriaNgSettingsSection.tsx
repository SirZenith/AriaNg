import { useTranslation } from 'react-i18next';
import SettingsSection from '@/components/settings/SettingsSection';
import { resetOptions } from '@/services/settingService';
import { ariaNgSettingsTabs } from './ariaNgSettingsTabs';
import ImportExportSection from './ImportExportSection';
import SettingsItemList from './SettingsItemList';

interface AriaNgSettingsSectionProps {
    activeTab?: string;
}

export default function AriaNgSettingsSection({ activeTab = 'settings' }: AriaNgSettingsSectionProps) {
    const { t } = useTranslation();
    const title = t(ariaNgSettingsTabs.find((tab) => tab.key === activeTab)?.label ?? 'Settings');

    const resetAll = () => {
        if (!window.confirm(t('Are you sure you want to reset all settings?'))) {
            return;
        }

        resetOptions();
        window.location.reload();
    };

    if (activeTab === 'importExport') {
        return (
            <SettingsSection title={title}>
                <div className="p-4">
                    <ImportExportSection />

                    <div className="mt-6">
                        <button type="button" className="btn btn-danger btn-sm" onClick={resetAll}>
                            {t('Reset Settings')}
                        </button>
                    </div>
                </div>
            </SettingsSection>
        );
    }

    return (
        <SettingsSection title={title}>
            <SettingsItemList />
        </SettingsSection>
    );
}
