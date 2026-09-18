import { useEffect } from 'react';

const scrollPositions = new Map<string, number>();

const maxRestoreFrames = 120;

export function useScrollRestoration(key: string): void {
    useEffect(() => {
        const container = document.querySelector<HTMLElement>('[data-scroll-container]');

        if (!container) {
            return;
        }

        const saved = scrollPositions.get(key) ?? 0;
        let frame = 0;
        let attempts = 0;
        let restoring = saved > 0;

        const handleScroll = () => {
            if (restoring) {
                return;
            }

            scrollPositions.set(key, container.scrollTop);
        };

        const restore = () => {
            if (!container.isConnected) {
                return;
            }

            container.scrollTop = saved;
            attempts += 1;

            if (restoring && container.scrollTop < saved && attempts < maxRestoreFrames) {
                frame = window.requestAnimationFrame(restore);
                return;
            }

            restoring = false;
        };

        restore();

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }

            container.removeEventListener('scroll', handleScroll);
        };
    }, [key]);
}
