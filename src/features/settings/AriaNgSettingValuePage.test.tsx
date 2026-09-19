import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ariaNgDefaultOptions } from '@/config/constants';
import { useSettingStore } from '@/stores/settingStore';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import AriaNgSettingValuePage from './AriaNgSettingValuePage';

afterEach(() => {
    window.localStorage.clear();
    useSettingStore.setState({ options: ariaNgDefaultOptions });
});

function renderPage() {
    return renderWithPanelBars(
        <MemoryRouter>
            <AriaNgSettingValuePage settingKey="theme" />
        </MemoryRouter>,
    );
}

describe('AriaNgSettingValuePage', () => {
    it('shows all choices and marks the current value', () => {
        renderPage();

        expect(screen.getByRole('option', { name: 'Light', selected: true })).toBeTruthy();
        expect(screen.getByRole('option', { name: 'Dark', selected: false })).toBeTruthy();
    });

    it('updates the setting and keeps the selection visible', () => {
        renderPage();

        fireEvent.click(screen.getByRole('option', { name: 'Dark' }));

        expect(useSettingStore.getState().options.theme).toBe('dark');
        expect(screen.getByRole('option', { name: 'Dark', selected: true })).toBeTruthy();
    });
});
