export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
    id: number;
    title: string;
    content: string;
    type: NotificationType;
    delay: number | false;
    count: number;
}

export interface NotificationOptions {
    type?: NotificationType;
    delay?: number | false;
    contentPrefix?: string;
}

const listeners = new Set<() => void>();
const timers = new Map<number, number>();
let items: NotificationItem[] = [];
let notificationId = 0;

function notify(): void {
    for (const listener of listeners) {
        listener();
    }
}

function scheduleRemoval(item: NotificationItem): void {
    const existing = timers.get(item.id);

    if (existing !== undefined) {
        window.clearTimeout(existing);
        timers.delete(item.id);
    }

    if (item.delay === false) {
        return;
    }

    timers.set(
        item.id,
        window.setTimeout(() => {
            removeNotification(item.id);
        }, item.delay),
    );
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
    const resolvedTitle = title;
    const resolvedContent = (options?.contentPrefix || '') + content;
    const type = options?.type || 'info';
    const delay = options?.delay === undefined ? 2000 : options.delay;

    const existing = items.find(
        (item) => item.title === resolvedTitle && item.content === resolvedContent && item.type === type,
    );

    if (existing) {
        const updated: NotificationItem = { ...existing, delay, count: existing.count + 1 };
        items = items.map((item) => (item.id === existing.id ? updated : item));
        notify();
        scheduleRemoval(updated);

        return updated;
    }

    const item: NotificationItem = {
        id: ++notificationId,
        title: resolvedTitle,
        content: resolvedContent,
        type,
        delay,
        count: 1,
    };

    items = [...items, item];
    notify();
    scheduleRemoval(item);

    return item;
}

export function removeNotification(id: number): void {
    const timer = timers.get(id);

    if (timer !== undefined) {
        window.clearTimeout(timer);
        timers.delete(id);
    }

    items = items.filter((item) => item.id !== id);
    notify();
}

export function clearNotifications(): void {
    for (const timer of timers.values()) {
        window.clearTimeout(timer);
    }

    timers.clear();
    items = [];
    notify();
}
