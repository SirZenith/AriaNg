import { ariaNgConstants } from '@/config/constants';

const prefix = ariaNgConstants.appPrefix;

function getStorageKey(key: string): string {
    return prefix ? prefix + '.' + key : key;
}

export function isLocalStorageSupported(): boolean {
    try {
        const key = '__ariang_test__';
        window.localStorage.setItem(key, '1');
        window.localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

export function storageGet<T>(key: string): T | null {
    try {
        const raw = window.localStorage.getItem(getStorageKey(key));

        if (raw === null) {
            return null;
        }

        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function storageSet(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(getStorageKey(key), JSON.stringify(value));
    } catch {
        // ignore storage errors
    }
}

export function storageRemove(key: string): void {
    try {
        window.localStorage.removeItem(getStorageKey(key));
    } catch {
        // ignore storage errors
    }
}

export function storageKeys(keyPrefix?: string): string[] {
    const result: string[] = [];
    const fullPrefix = keyPrefix ? getStorageKey(keyPrefix) : prefix + '.';

    for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);

        if (key && key.indexOf(fullPrefix) === 0) {
            result.push(key.substring(prefix.length + 1));
        }
    }

    return result;
}

export function storageClearAll(): void {
    for (const key of storageKeys()) {
        storageRemove(key);
    }
}
