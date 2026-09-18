import i18n from '@/i18n';
import type { AriaNgOptions } from '@/config/constants';
import { hasBrowserPermission, requestBrowserPermission } from '@/services/browserNotification';
import { setDebugMode } from '@/services/settingService';
import { useSettingStore } from '@/stores/settingStore';
import type { AriaNgSettingItem } from './ariaNgSettingItems';

function setOptionValue(key: keyof AriaNgOptions, value: unknown): void {
    (useSettingStore.getState().setOption as (key: keyof AriaNgOptions, value: unknown) => void)(key, value);
}

export function setAriaNgSettingValue(item: AriaNgSettingItem, value: string): void {
    if (item.key === 'debug') {
        return;
    }

    setOptionValue(item.key, item.numeric ? Number(value) : value);

    if (item.special === 'language') {
        void i18n.changeLanguage(value);
    }
}

export function toggleAriaNgSettingSwitch(item: AriaNgSettingItem, checked: boolean): void {
    if (item.special === 'browserNotification') {
        void (async () => {
            if (checked && !hasBrowserPermission()) {
                const granted = await requestBrowserPermission();

                if (!granted) {
                    return;
                }
            }

            setOptionValue('browserNotification', checked);
        })();

        return;
    }

    if (item.special === 'debugMode') {
        setDebugMode(checked);
        window.location.reload();
        return;
    }

    if (item.key === 'debug') {
        return;
    }

    setOptionValue(item.key, checked);
}
