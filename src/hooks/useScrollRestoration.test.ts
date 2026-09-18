import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useScrollRestoration } from './useScrollRestoration';

describe('useScrollRestoration', () => {
    let container: HTMLDivElement;
    let scrollTopValue: number;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        container.setAttribute('data-scroll-container', '');
        scrollTopValue = 0;

        Object.defineProperty(container, 'scrollTop', {
            get: () => scrollTopValue,
            set: (value: number) => {
                scrollTopValue = Math.max(0, value);
            },
            configurable: true,
        });

        document.body.appendChild(container);
    });

    it('saves and restores the scroll position for the same key', () => {
        const first = renderHook(() => useScrollRestoration('test-restore'));

        scrollTopValue = 420;
        container.dispatchEvent(new Event('scroll'));
        first.unmount();

        scrollTopValue = 0;

        renderHook(() => useScrollRestoration('test-restore'));

        expect(scrollTopValue).toBe(420);
    });

    it('keeps separate positions per key', () => {
        const first = renderHook(() => useScrollRestoration('test-key-a'));

        scrollTopValue = 100;
        container.dispatchEvent(new Event('scroll'));
        first.unmount();

        const second = renderHook(() => useScrollRestoration('test-key-b'));

        scrollTopValue = 55;
        container.dispatchEvent(new Event('scroll'));
        second.unmount();

        scrollTopValue = 0;
        renderHook(() => useScrollRestoration('test-key-a'));
        expect(scrollTopValue).toBe(100);

        scrollTopValue = 0;
        renderHook(() => useScrollRestoration('test-key-b'));
        expect(scrollTopValue).toBe(55);
    });
});
