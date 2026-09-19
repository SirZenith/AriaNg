import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import BottomBar from './BottomBar';
import { BarHost, PanelBarProvider } from './PanelBar';
import TopBar from './TopBar';

function renderSlots(ui: ReactNode) {
    return render(
        <PanelBarProvider>
            <BarHost slot="top" />
            <BarHost slot="bottom" fallback={<div>bottom-nav-fallback</div>} />
            {ui}
        </PanelBarProvider>,
    );
}

describe('PanelBar', () => {
    it('renders top and bottom bar content in the layout hosts', () => {
        renderSlots(
            <>
                <TopBar>top-content</TopBar>
                <BottomBar>bottom-content</BottomBar>
            </>,
        );

        expect(screen.getByText('top-content')).toBeTruthy();
        expect(screen.getByText('bottom-content')).toBeTruthy();
        expect(screen.queryByText('bottom-nav-fallback')).toBeNull();
    });

    it('renders the fallback while no bottom bar is declared', () => {
        renderSlots(null);

        expect(screen.getByText('bottom-nav-fallback')).toBeTruthy();
    });

    it('restores the fallback after the bottom bar unmounts', () => {
        const { rerender } = renderSlots(<BottomBar>bottom-content</BottomBar>);

        expect(screen.getByText('bottom-content')).toBeTruthy();
        expect(screen.queryByText('bottom-nav-fallback')).toBeNull();

        rerender(
            <PanelBarProvider>
                <BarHost slot="top" />
                <BarHost slot="bottom" fallback={<div>bottom-nav-fallback</div>} />
            </PanelBarProvider>,
        );

        expect(screen.queryByText('bottom-content')).toBeNull();
        expect(screen.getByText('bottom-nav-fallback')).toBeTruthy();
    });

    it('updates the portal content when the page state changes', () => {
        function StatefulBottomBar() {
            const [count, setCount] = useState(0);

            return (
                <>
                    <BottomBar>
                        <span>count: {count}</span>
                    </BottomBar>
                    <button type="button" onClick={() => setCount((value) => value + 1)}>
                        increment
                    </button>
                </>
            );
        }

        renderSlots(<StatefulBottomBar />);

        expect(screen.getByText('count: 0')).toBeTruthy();

        fireEvent.click(screen.getByText('increment'));

        expect(screen.getByText('count: 1')).toBeTruthy();
    });

    it('throws when a bar is rendered without the provider', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => render(<TopBar>orphan</TopBar>)).toThrow(/PanelBarProvider/);

        errorSpy.mockRestore();
    });
});
