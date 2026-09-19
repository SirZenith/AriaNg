import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { BarHost, PanelBarProvider } from '@/components/PanelBar';

export function renderWithPanelBars(ui: ReactNode) {
    return render(
        <PanelBarProvider>
            <BarHost slot="top" />
            <BarHost slot="bottom" />
            {ui}
        </PanelBarProvider>,
    );
}
