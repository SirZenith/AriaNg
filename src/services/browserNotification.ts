import i18n from '@/i18n';
import { ariaNgConstants } from '@/config/constants';
import { log } from '@/services/log';
import { getBrowserNotification, getBrowserNotificationFrequency, getBrowserNotificationSound } from '@/services/settingService';
import { storageGet, storageSet } from '@/services/storage';
import type { Aria2Task } from '@/types/aria2';

interface NotificationRecord {
    time: number;
}

export function isSupportBrowserNotification(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
}

export function hasBrowserPermission(): boolean {
    return isSupportBrowserNotification() && window.Notification.permission === 'granted';
}

export async function requestBrowserPermission(): Promise<boolean> {
    if (!isSupportBrowserNotification()) {
        return false;
    }

    try {
        const permission = await window.Notification.requestPermission();
        return permission === 'granted';
    } catch {
        return false;
    }
}

function getHistory(): NotificationRecord[] {
    const history = storageGet<NotificationRecord[]>(ariaNgConstants.browserNotificationHistoryStorageKey);

    return Array.isArray(history) ? history : [];
}

function isReachFrequencyLimit(): boolean {
    const frequency = getBrowserNotificationFrequency();

    if (!frequency || frequency === 'unlimited') {
        return false;
    }

    const history = getHistory();

    if (history.length < 1) {
        return false;
    }

    const now = Date.now();

    if (frequency === 'high') {
        if (history.length < 10) {
            return false;
        }

        return now - history[history.length - 10].time < 60 * 1000;
    } else if (frequency === 'middle') {
        return now - history[history.length - 1].time < 60 * 1000;
    } else if (frequency === 'low') {
        return now - history[history.length - 1].time < 5 * 60 * 1000;
    }

    return false;
}

function recordHistory(): void {
    const frequency = getBrowserNotificationFrequency();

    if (!frequency || frequency === 'unlimited') {
        return;
    }

    const history = getHistory();
    history.push({ time: Date.now() });

    if (history.length > 10) {
        history.splice(0, history.length - 10);
    }

    storageSet(ariaNgConstants.browserNotificationHistoryStorageKey, history);
}

export function notifyViaBrowser(title: string, content: string): void {
    if (!getBrowserNotification() || !hasBrowserPermission() || isReachFrequencyLimit()) {
        return;
    }

    recordHistory();

    try {
        const notification = new window.Notification(title, {
            body: content,
            icon: '/tileicon.png',
            silent: !getBrowserNotificationSound()
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    } catch (ex) {
        log.warn('[browserNotification] failed to show notification', ex);
    }
}

export function notifyTaskComplete(task: Aria2Task | null): void {
    notifyViaBrowser(i18n.t('Download Completed'), task?.taskName || '');
}

export function notifyBtTaskComplete(task: Aria2Task | null): void {
    notifyViaBrowser(i18n.t('BT Download Completed'), task?.taskName || '');
}

export function notifyTaskError(task: Aria2Task | null): void {
    notifyViaBrowser(i18n.t('Download Error'), task?.taskName || '');
}
