import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePanelBar } from './panelBarContext';

export default function BottomBar({ children }: { children: ReactNode }) {
    const { container } = usePanelBar('bottom');

    return container ? createPortal(children, container) : null;
}
