import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import StatusSection from '@/features/status/StatusSection';
import { aria2SettingService } from '@/services/aria2SettingService';
import { notifyInPage } from '@/services/notification';
import Aria2OptionItemList from './Aria2OptionItemList';
import Aria2OptionValuePage from './Aria2OptionValuePage';
import AriaNgSettingValuePage from './AriaNgSettingValuePage';
import AriaNgSettingsSection from './AriaNgSettingsSection';
import { protocolCategories } from './protocolCategories';
import RpcSettingFieldPage from './RpcSettingFieldPage';
import RpcSettingsEditor from './RpcSettingsEditor';
import RpcSettingsMenu from './RpcSettingsMenu';
import SettingsMenu from './SettingsMenu';
import { settingsSubItems } from './settingsCategories';

function Panel({ children }: { children: ReactNode }) {
    return <section className="rounded-xl bg-white shadow dark:bg-gray-800">{children}</section>;
}

export default function Aria2SettingsPage() {
    const { t } = useTranslation();
    const { type, sub, item, field } = useParams();
    const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const protocolType = type ? protocolCategories.find((category) => category.key === type)?.key : undefined;
    const showProtocolSettings = type === 'protocol' || !!protocolType;
    const optionCategory = type === 'protocol' ? sub : type;

    const optionItems = useMemo(() => {
        const keys = optionCategory ? aria2SettingService.getAvailableGlobalOptionsKeys(optionCategory) : false;

        return Array.isArray(keys) ? aria2SettingService.getSpecifiedOptions(keys) : [];
    }, [optionCategory]);

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
        return <SettingsMenu />;
    }

    if (settingsSubItems[type] && !sub) {
        return <SettingsMenu type={type} />;
    }

    if (type === 'ariang' && sub === 'rpc') {
        if (item && field) {
            return <RpcSettingFieldPage rpcItem={item} field={field} />;
        }

        if (item) {
            return (
                <Panel>
                    <div className="p-4">
                        <RpcSettingsEditor key={item} item={item} />
                    </div>
                </Panel>
            );
        }

        return <RpcSettingsMenu />;
    }

    const renderOptionValuePage = (optionKey: string) => {
        const option = optionItems.find((entry) => entry.key === optionKey);

        if (!option || !option.options || option.options.length < 1) {
            return null;
        }

        return (
            <Aria2OptionValuePage
                option={option}
                value={globalOptions[option.key] ?? option.defaultValue ?? ''}
                onChange={(key, value) => void changeOption(key, value)}
            />
        );
    };

    if (type === 'ariang' && sub === 'settings') {
        return item ? <AriaNgSettingValuePage settingKey={item} /> : <AriaNgSettingsSection />;
    }

    if ((type === 'basic' || type === 'advanced') && sub) {
        const page = renderOptionValuePage(sub);

        if (page) {
            return page;
        }
    }

    if (type === 'protocol' && sub && item) {
        const page = renderOptionValuePage(item);

        if (page) {
            return page;
        }
    }

    if (type === 'status') {
        return (
            <Panel>
                <StatusSection />
            </Panel>
        );
    }

    if (type === 'ariang') {
        return (
            <Panel>
                <AriaNgSettingsSection activeTab={sub} />
            </Panel>
        );
    }

    if (loading) {
        return (
            <Panel>
                <div className="p-6 text-center text-sm text-gray-500">{t('Loading')}</div>
            </Panel>
        );
    }

    const routeBase = showProtocolSettings
        ? '/settings/aria2/protocol/' + (sub || protocolType || protocolCategories[0].key)
        : '/settings/aria2/' + (type || '');

    return (
        <Panel>
            <Aria2OptionItemList
                routeBase={routeBase}
                options={optionItems}
                values={globalOptions}
                onChange={(key, value) => void changeOption(key, value)}
            />
        </Panel>
    );
}

function i18nText(data: unknown): string {
    if (data && typeof data === 'object' && 'message' in data) {
        return String((data as { message: unknown; }).message);
    }

    return String(data);
}
