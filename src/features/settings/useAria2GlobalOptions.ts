import { useCallback, useEffect, useState } from 'react';
import { aria2SettingService } from '@/services/aria2SettingService';
import { notifyInPage } from '@/services/notification';

export default function useAria2GlobalOptions() {
    const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

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
    }, []);

    const changeOption = useCallback(async (key: string, value: string) => {
        setGlobalOptions((current) => ({ ...current, [key]: value }));

        const response = await aria2SettingService.setGlobalOption(key, value);

        if (!response.success && response.data) {
            notifyInPage('Error', i18nText(response.data), { type: 'error', delay: false });
        }
    }, []);

    return { globalOptions, loading, changeOption };
}

function i18nText(data: unknown): string {
    if (data && typeof data === 'object' && 'message' in data) {
        return String((data as { message: unknown; }).message);
    }

    return String(data);
}
