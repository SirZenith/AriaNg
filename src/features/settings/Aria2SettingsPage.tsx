import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useParams } from 'react-router-dom';
import OptionForm from '@/components/OptionForm';
import { aria2SettingService } from '@/services/aria2SettingService';
import { notifyInPage } from '@/services/notification';

const categories = [
    { key: 'basic', label: 'Basic Settings' },
    { key: 'http-ftp-sftp', label: 'HTTP/FTP/SFTP Settings' },
    { key: 'http', label: 'HTTP Settings' },
    { key: 'ftp-sftp', label: 'FTP/SFTP Settings' },
    { key: 'bt', label: 'BitTorrent Settings' },
    { key: 'metalink', label: 'Metalink Settings' },
    { key: 'rpc', label: 'RPC Settings' },
    { key: 'advanced', label: 'Advanced Settings' }
];

export default function Aria2SettingsPage() {
    const { t } = useTranslation();
    const { type = 'basic' } = useParams();
    const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const optionItems = useMemo(() => {
        const keys = aria2SettingService.getAvailableGlobalOptionsKeys(type);

        return Array.isArray(keys) ? aria2SettingService.getSpecifiedOptions(keys) : [];
    }, [type]);

    useEffect(() => {
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

    return (
        <section className="rounded bg-white p-4 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold">{t('Aria2 Settings')}</h2>

            <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                {categories.map((category) => (
                    <NavLink
                        key={category.key}
                        to={'/settings/aria2/' + category.key}
                        className={({ isActive }) =>
                            'rounded px-2 py-1 text-sm ' +
                            (isActive ? 'bg-[#3c8dbc] text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300')
                        }
                    >
                        {t(category.label)}
                    </NavLink>
                ))}
            </div>

            {loading ? (
                <div className="p-6 text-center text-sm text-gray-500">{t('Loading')}</div>
            ) : (
                <OptionForm options={optionItems} values={globalOptions} onChange={(key, value) => void changeOption(key, value)} />
            )}
        </section>
    );
}

function i18nText(data: unknown): string {
    if (data && typeof data === 'object' && 'message' in data) {
        return String((data as { message: unknown }).message);
    }

    return String(data);
}
