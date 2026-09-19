import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { PanelBarContext, usePanelBarHost, type PanelBarContextValue, type PanelBarSlot } from './panelBarContext';

const slotClassName: Record<PanelBarSlot, string> = {
    top: 'bg-page px-4 pt-2 pb-2',
    bottom: 'bottom-bar-container',
};

export function PanelBarProvider({ children }: { children: ReactNode }) {
    const [containers, setContainers] = useState<Record<PanelBarSlot, HTMLElement | null>>({
        top: null,
        bottom: null,
    });
    const [registrations, setRegistrations] = useState<Record<PanelBarSlot, ReadonlySet<symbol>>>({
        top: new Set(),
        bottom: new Set(),
    });

    const setContainer = useCallback((slot: PanelBarSlot, container: HTMLElement | null) => {
        setContainers((current) => (current[slot] === container ? current : { ...current, [slot]: container }));
    }, []);

    const register = useCallback((slot: PanelBarSlot) => {
        const key = Symbol(slot);

        setRegistrations((current) => {
            const next = new Set(current[slot]);
            next.add(key);

            return { ...current, [slot]: next };
        });

        return () => {
            setRegistrations((current) => {
                const next = new Set(current[slot]);
                next.delete(key);

                return { ...current, [slot]: next };
            });
        };
    }, []);

    const value = useMemo<PanelBarContextValue>(
        () => ({
            slots: {
                top: { container: containers.top, hasContent: registrations.top.size > 0 },
                bottom: { container: containers.bottom, hasContent: registrations.bottom.size > 0 },
            },
            setContainer,
            register,
        }),
        [containers, registrations, setContainer, register],
    );

    return <PanelBarContext.Provider value={value}>{children}</PanelBarContext.Provider>;
}

export function BarHost({ slot, fallback }: { slot: PanelBarSlot; fallback?: ReactNode }) {
    const { setContainer, hasContent } = usePanelBarHost(slot);

    return (
        <>
            {hasContent ? null : fallback}
            <div ref={setContainer} className={hasContent ? slotClassName[slot] : undefined} />
        </>
    );
}
