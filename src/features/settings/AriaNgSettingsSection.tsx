import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Switch from '@/components/Switch';
import { notifyInPage } from '@/services/notification';
import { resetOptions } from '@/services/settingService';
import { getBuildCommit, getBuildVersion } from '@/services/version';
import { useSettingStore } from '@/stores/settingStore';
import { ariaNgSettingItems, getAriaNgSettingValue, type AriaNgSettingChoice } from './ariaNgSettingItems';
import { setAriaNgSettingValue, toggleAriaNgSettingSwitch } from './ariaNgSettingValue';
import { ariaNgSettingsTabs } from './ariaNgSettingsTabs';
import ImportExportSection from './ImportExportSection';
import RpcSettingsSection from './RpcSettingsSection';
import SettingsItemList from './SettingsItemList';

const inputClass = 'input';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:items-center">
            <label className="text-sm font-medium">{label}</label>
            <div className="sm:col-span-2">{children}</div>
        </div>
    );
}

interface AriaNgSettingsSectionProps {
    hideTabs?: boolean;
    activeTab?: string;
    mobile?: boolean;
}

export default function AriaNgSettingsSection({
    hideTabs = false,
    activeTab,
    mobile = false,
}: AriaNgSettingsSectionProps) {
    const { t } = useTranslation();
    const options = useSettingStore((state) => state.options);
    const [currentTab, setCurrentTab] = useState(activeTab ?? ariaNgSettingsTabs[0].key);

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

    const getChoiceLabel = (choice: AriaNgSettingChoice) =>
        choice.label ?? t(choice.labelKey ?? '', choice.labelParams);

    const magnetHandlerButton = (
        <button
            type="button"
            className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600"
            onClick={registerMagnetHandler}
        >
            {t('Register as Magnet Handler')}
        </button>
    );

    const renderDesktopSettings = () => (
        <div className="flex flex-col gap-3">
            {ariaNgSettingItems.map((item) => {
                const value = getAriaNgSettingValue(options, item);

                if (item.kind === 'select') {
                    return (
                        <Field key={item.key} label={t(item.label)}>
                            <select
                                className={inputClass}
                                value={value}
                                onChange={(event) => setAriaNgSettingValue(item, event.target.value)}
                            >
                                {item.choices?.map((choice) => (
                                    <option key={choice.value} value={choice.value}>
                                        {getChoiceLabel(choice)}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    );
                }

                if (item.kind === 'switch') {
                    return (
                        <Field key={item.key} label={t(item.label)}>
                            <Switch
                                checked={value === 'true'}
                                onChange={(checked) => toggleAriaNgSettingSwitch(item, checked)}
                                aria-label={t(item.label)}
                            />
                        </Field>
                    );
                }

                return (
                    <Field key={item.key} label={t(item.label)}>
                        <input
                            className={inputClass}
                            value={value}
                            onChange={(event) => setAriaNgSettingValue(item, event.target.value)}
                        />
                    </Field>
                );
            })}

            {magnetHandlerButton}
        </div>
    );

    return (
        <>
            {hideTabs || mobile ? null : (
                <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                    {ariaNgSettingsTabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={
                                'rounded px-2 py-1 text-sm ' +
                                (currentTab === tab.key
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300')
                            }
                            onClick={() => setCurrentTab(tab.key)}
                        >
                            {t(tab.label)}
                        </button>
                    ))}
                </div>
            )}

            {currentTab === 'settings' ? (
                mobile ? (
                    <div className="space-y-4">
                        <SettingsItemList />
                        {magnetHandlerButton}
                    </div>
                ) : (
                    renderDesktopSettings()
                )
            ) : null}

            {currentTab === 'rpc' ? <RpcSettingsSection /> : null}

            {currentTab === 'importExport' ? (
                <>
                    <ImportExportSection />

                    <div className="mt-6">
                        <button type="button" className="btn btn-danger btn-sm" onClick={resetAll}>
                            {t('Reset Settings')}
                        </button>
                    </div>
                </>
            ) : null}

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                {t('AriaNg Version')}: {getBuildVersion()} ({getBuildCommit()})
            </p>
        </>
    );
}
