import { createContext, useCallback, useContext, useLayoutEffect, type RefCallback } from 'react';

export type PanelBarSlot = 'top' | 'bottom';

export interface PanelBarSlotState {
    container: HTMLElement | null;
    hasContent: boolean;
}

export interface PanelBarContextValue {
    slots: Record<PanelBarSlot, PanelBarSlotState>;
    setContainer: (slot: PanelBarSlot, container: HTMLElement | null) => void;
    register: (slot: PanelBarSlot) => () => void;
}

export const PanelBarContext = createContext<PanelBarContextValue | null>(null);

export function usePanelBarContext(): PanelBarContextValue {
    const context = useContext(PanelBarContext);

    if (!context) {
        throw new Error('TopBar and BottomBar must be rendered inside PanelBarProvider');
    }

    return context;
}

export function usePanelBar(slot: PanelBarSlot): PanelBarSlotState {
    const { slots, register } = usePanelBarContext();

    useLayoutEffect(() => register(slot), [register, slot]);

    return slots[slot];
}

export function usePanelBarHost(slot: PanelBarSlot): {
    setContainer: RefCallback<HTMLDivElement>;
    hasContent: boolean;
} {
    const { slots, setContainer } = usePanelBarContext();

    const ref = useCallback<RefCallback<HTMLDivElement>>((node) => setContainer(slot, node), [setContainer, slot]);

    return { setContainer: ref, hasContent: slots[slot].hasContent };
}
