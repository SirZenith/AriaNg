export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
    id: number;
    title: string;
    content: string;
    type: NotificationType;
    delay: number | false;
}

export interface NotificationOptions {
    type?: NotificationType;
    delay?: number | false;
    contentPrefix?: string;
}

const listeners = new Set<() => void>();
let items: NotificationItem[] = [];
let notificationId = 0;

function notify(): void {
    for (const listener of listeners) {
        listener();
    }
}

export function subscribeNotifications(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function getNotifications(): NotificationItem[] {
    return items;
}

export function notifyInPage(title: string, content: string, options?: NotificationOptions): NotificationItem {
    const item: NotificationItem = {
        id: ++notificationId,
        title,
        content: (options?.contentPrefix || '') + content,
        type: options?.type || 'info',
        delay: options?.delay === undefined ? 2000 : options.delay,
    };

    items = [...items, item];
    notify();

    if (item.delay !== false) {
        window.setTimeout(() => {
            removeNotification(item.id);
        }, item.delay);
    }

    return item;
}

export function removeNotification(id: number): void {
    items = items.filter((item) => item.id !== id);
    notify();
}

export function clearNotifications(): void {
    items = [];
    notify();
}
