import { useCallback, useSyncExternalStore } from 'react';

function getMediaQueryList(query: string): MediaQueryList | null {
    if (typeof window.matchMedia !== 'function') {
        return null;
    }

    return window.matchMedia(query);
}

export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const mediaQueryList = getMediaQueryList(query);

            if (!mediaQueryList) {
                return () => undefined;
            }

            mediaQueryList.addEventListener('change', onStoreChange);

            return () => mediaQueryList.removeEventListener('change', onStoreChange);
        },
        [query],
    );

    const getSnapshot = useCallback(() => getMediaQueryList(query)?.matches ?? false, [query]);

    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
