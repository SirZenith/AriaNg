import { useTranslation } from 'react-i18next';
import SettingsSection from '@/components/settings/SettingsSection';
import { notifyInPage } from '@/services/notification';
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

    const registerMagnetHandler = () => {
        if (typeof navigator.registerProtocolHandler !== 'function') {
            notifyInPage('Error', t('This browser does not support registering a magnet handler'), { type: 'error' });
            return;
        }

        const templateUrl = window.location.origin + window.location.pathname + '#/new?uri=%s';

        try {
            navigator.registerProtocolHandler('magnet', templateUrl);
            notifyInPage('', t('Magnet handler registration requested'), { type: 'success' });
        } catch {
            notifyInPage('Error', t('Failed to register a magnet handler'), { type: 'error' });
        }
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
        <div className="space-y-4">
            <SettingsSection title={title}>
                <SettingsItemList />
            </SettingsSection>

            <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={registerMagnetHandler}
            >
                {t('Register as Magnet Handler')}
            </button>
        </div>
    );
}
