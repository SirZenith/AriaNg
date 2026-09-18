import i18n from '@/i18n';
import type { AriaNgOptions } from '@/config/constants';
import { hasBrowserPermission, requestBrowserPermission } from '@/services/browserNotification';
import { notifyInPage } from '@/services/notification';
import { setDebugMode } from '@/services/settingService';
import { useSettingStore } from '@/stores/settingStore';
import type { AriaNgSettingItem } from './ariaNgSettingItems';

function setOptionValue(key: keyof AriaNgOptions, value: unknown): void {
    (useSettingStore.getState().setOption as (key: keyof AriaNgOptions, value: unknown) => void)(key, value);
}

function magnetHandlerUrl(): string {
    return window.location.origin + window.location.pathname + '#/new?uri=%s';
}

function setMagnetHandler(registered: boolean): void {
    if (registered) {
        if (typeof navigator.registerProtocolHandler !== 'function') {
            notifyInPage('Error', i18n.t('This browser does not support registering a magnet handler'), {
                type: 'error',
            });
            return;
        }

        try {
            navigator.registerProtocolHandler('magnet', magnetHandlerUrl());
            setOptionValue('registerMagnetHandler', true);
            notifyInPage('', i18n.t('Magnet handler registration requested'), { type: 'success' });
        } catch {
            notifyInPage('Error', i18n.t('Failed to register a magnet handler'), { type: 'error' });
        }

        return;
    }

    const unregister = (
        navigator as Navigator & { unregisterProtocolHandler?: (scheme: string, url: string) => void; }
    ).unregisterProtocolHandler;

    if (typeof unregister === 'function') {
        try {
            unregister.call(navigator, 'magnet', magnetHandlerUrl());
        } catch {
            // some browsers reject unregistering a protocol handler
        }
    }

    setOptionValue('registerMagnetHandler', false);
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

    if (item.special === 'magnetHandler') {
        setMagnetHandler(checked);
        return;
    }

    if (item.key === 'debug') {
        return;
    }

    setOptionValue(item.key, checked);
}
