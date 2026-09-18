import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, useParams } from 'react-router-dom';
import OptionForm from '@/components/OptionForm';
import StatusSection from '@/features/status/StatusSection';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { aria2SettingService } from '@/services/aria2SettingService';
import { notifyInPage } from '@/services/notification';
import AriaNgSettingsSection from './AriaNgSettingsSection';
import { protocolCategories } from './protocolCategories';
import ProtocolSettingsSection from './ProtocolSettingsSection';
import SettingsMenu from './SettingsMenu';
import { settingsCategories, settingsSubItems } from './settingsCategories';

export default function Aria2SettingsPage() {
    const { t } = useTranslation();
    const { type, sub } = useParams();
    const isMobile = useMediaQuery('(max-width: 1023px)');
    const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const protocolType = type ? protocolCategories.find((category) => category.key === type)?.key : undefined;
    const showProtocolSettings = type === 'protocol' || !!protocolType;

    const optionItems = useMemo(() => {
        const keys = type ? aria2SettingService.getAvailableGlobalOptionsKeys(type) : false;

        return Array.isArray(keys) ? aria2SettingService.getSpecifiedOptions(keys) : [];
    }, [type]);

    useEffect(() => {
        if (!type || type === 'ariang' || type === 'status') {
            return;
        }

        let cancelled = false;

        void (async () => {
            setLoading(true);
            const response = await aria2SettingService.getGlobalOption();

            if (!cancelled && response.success && response.data) {
                setGlobalOptions(response.data as Record<string, string>);
            }

            if (!cancelled) {
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [type]);

    const changeOption = async (key: string, value: string) => {
        setGlobalOptions((current) => ({ ...current, [key]: value }));

        const response = await aria2SettingService.setGlobalOption(key, value);

        if (!response.success && response.data) {
            notifyInPage('Error', i18nText(response.data), { type: 'error', delay: false });
        }
    };

    if (!type) {
        return isMobile ? <SettingsMenu /> : <Navigate to="/settings/aria2/ariang" replace />;
    }

    if (isMobile && settingsSubItems[type] && !sub) {
        return <SettingsMenu type={type} />;
    }

    const renderContent = () => {
        if (type === 'ariang') {
            return <AriaNgSettingsSection key={sub || 'settings'} hideTabs={isMobile} activeTab={sub} />;
        }

        if (type === 'status') {
            return <StatusSection />;
        }

        if (loading) {
            return <div className="p-6 text-center text-sm text-gray-500">{t('Loading')}</div>;
        }

        if (showProtocolSettings) {
            const initialType = sub || protocolType || protocolCategories[0].key;

            return (
                <ProtocolSettingsSection
                    key={initialType}
                    hideTabs={isMobile}
                    initialType={initialType}
                    options={globalOptions}
                    onChange={(key, value) => void changeOption(key, value)}
                />
            );
        }

        return (
            <OptionForm
                options={optionItems}
                values={globalOptions}
                onChange={(key, value) => void changeOption(key, value)}
            />
        );
    };

    return (
        <section className="rounded bg-white p-4 shadow dark:bg-gray-800">
            {isMobile ? null : (
                <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                    {settingsCategories.map((category) => {
                        const Icon = category.icon;

                        return (
                            <NavLink
                                key={category.key}
                                to={'/settings/aria2/' + category.key}
                                className={({ isActive }) => {
                                    const active = category.key === 'protocol' ? showProtocolSettings : isActive;

                                    return (
                                        'flex items-center gap-1 rounded px-2 py-1 text-sm ' +
                                        (active
                                            ? 'bg-[#3c8dbc] text-white'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300')
                                    );
                                }}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {t(category.label)}
                            </NavLink>
                        );
                    })}
                </div>
            )}

            {renderContent()}
        </section>
    );
}

function i18nText(data: unknown): string {
    if (data && typeof data === 'object' && 'message' in data) {
        return String((data as { message: unknown }).message);
    }

    return String(data);
}
