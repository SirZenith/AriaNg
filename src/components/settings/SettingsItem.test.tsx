import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SettingsItem from './SettingsItem';

function renderItem(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('SettingsItem', () => {
    it('renders a navigation item as a link', () => {
        renderItem(<SettingsItem label="Theme" indicator={{ type: 'navigate' }} to="/settings/theme" />);

        expect(screen.getByRole('link', { name: 'Theme' }).getAttribute('href')).toBe('/settings/theme');
    });

    it('shows the value text for a value item', () => {
        renderItem(
            <SettingsItem label="Page Title" indicator={{ type: 'value', text: 'AriaNg' }} onClick={() => undefined} />,
        );

        expect(screen.getByText('AriaNg')).toBeTruthy();
    });

    it('toggles a switch indicator', () => {
        const onChange = vi.fn();

        renderItem(<SettingsItem label="Debug Mode" indicator={{ type: 'switch', checked: false, onChange }} />);

        fireEvent.click(screen.getByRole('switch', { name: 'Debug Mode' }));

        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('reflects the selected state of a choice item', () => {
        renderItem(
            <SettingsItem
                label="Light"
                indicator={{ type: 'check', selected: true }}
                onClick={() => undefined}
                role="option"
                ariaSelected
            />,
        );

        expect(screen.getByRole('option', { name: 'Light' }).getAttribute('aria-selected')).toBe('true');
    });

    it('renders a readonly value item without a chevron', () => {
        renderItem(
            <SettingsItem
                label="GID"
                indicator={{ type: 'value', text: 'abc' }}
                onClick={() => undefined}
                disabled
            />,
        );

        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders the description as a tooltip', () => {
        renderItem(
            <SettingsItem
                label="Dir"
                description="Download directory"
                indicator={{ type: 'value', text: '/downloads' }}
                onClick={() => undefined}
            />,
        );

        expect(screen.getByText('Download directory')).toBeTruthy();
    });

    it('shows the description modal on long press on small screens', () => {
        vi.useFakeTimers();

        try {
            renderItem(
                <SettingsItem
                    label="Dir"
                    description="Download directory"
                    indicator={{ type: 'value', text: '/downloads' }}
                    onClick={() => undefined}
                />,
            );

            fireEvent.pointerDown(screen.getByRole('button'));

            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(screen.getAllByText('Download directory').length).toBe(2);
        } finally {
            vi.useRealTimers();
        }
    });

    it('does not open the description modal on large screens', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: true }) as unknown as MediaQueryList);
        vi.useFakeTimers();

        try {
            renderItem(
                <SettingsItem
                    label="Dir"
                    description="Download directory"
                    indicator={{ type: 'value', text: '/downloads' }}
                    onClick={() => undefined}
                />,
            );

            fireEvent.pointerDown(screen.getByRole('button'));

            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(screen.getAllByText('Download directory').length).toBe(1);
        } finally {
            vi.useRealTimers();
            vi.unstubAllGlobals();
        }
    });

    it('places the tooltip above when the item is near the viewport bottom', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: true }) as unknown as MediaQueryList);
        vi.stubGlobal('innerHeight', 720);

        const rectSpy = vi
            .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockReturnValue({ bottom: 700 } as DOMRect);

        try {
            renderItem(
                <SettingsItem
                    label="Dir"
                    description="Download directory"
                    indicator={{ type: 'value', text: '/downloads' }}
                    onClick={() => undefined}
                />,
            );

            fireEvent.pointerEnter(screen.getByRole('button'));

            expect(screen.getByText('Download directory').className).toContain('settings-tooltip-up');
        } finally {
            rectSpy.mockRestore();
            vi.unstubAllGlobals();
        }
    });
});
