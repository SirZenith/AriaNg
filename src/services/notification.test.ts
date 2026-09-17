import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearNotifications, getNotifications, notifyInPage, removeNotification } from './notification';

describe('notifyInPage', () => {
    beforeEach(() => {
        clearNotifications();
        vi.useRealTimers();
    });

    it('merges duplicate notifications and counts occurrences', () => {
        notifyInPage('Error', 'same message', { delay: false });
        notifyInPage('Error', 'same message', { delay: false });

        const items = getNotifications();
        expect(items).toHaveLength(1);
        expect(items[0].count).toBe(2);
    });

    it('keeps different contents separate', () => {
        notifyInPage('Error', 'message a', { delay: false });
        notifyInPage('Error', 'message b', { delay: false });

        expect(getNotifications()).toHaveLength(2);
    });

    it('does not merge across different types', () => {
        notifyInPage('Error', 'same message', { type: 'error', delay: false });
        notifyInPage('Error', 'same message', { type: 'success', delay: false });

        expect(getNotifications()).toHaveLength(2);
    });

    it('removes a notification by id', () => {
        const item = notifyInPage('', 'message', { delay: false });
        removeNotification(item.id);

        expect(getNotifications()).toHaveLength(0);
    });

    it('auto removes after the delay', () => {
        vi.useFakeTimers();
        notifyInPage('', 'message', { delay: 1000 });

        expect(getNotifications()).toHaveLength(1);

        vi.advanceTimersByTime(1000);

        expect(getNotifications()).toHaveLength(0);
    });
});
