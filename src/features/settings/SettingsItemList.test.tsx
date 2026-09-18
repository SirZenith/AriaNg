import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ariaNgDefaultOptions } from '@/config/constants';
import { useSettingStore } from '@/stores/settingStore';
import SettingsItemList from './SettingsItemList';

function renderList() {
    return render(
        <MemoryRouter>
            <SettingsItemList />
        </MemoryRouter>,
    );
}

afterEach(() => {
    window.localStorage.clear();
    useSettingStore.setState({ options: ariaNgDefaultOptions });
});

describe('SettingsItemList', () => {
    it('links select settings to their value page with the current value', () => {
        renderList();

        const link = screen.getByRole('link', { name: /Theme/ });

        expect(link.getAttribute('href')).toBe('/settings/aria2/ariang/settings/theme');
        expect(link.textContent).toContain('Light');
    });

    it('toggles a boolean setting with a switch', () => {
        renderList();

        fireEvent.click(screen.getByRole('switch', { name: 'Keyboard Shortcuts' }));

        expect(useSettingStore.getState().options.keyboardShortcuts).toBe(false);
    });

    it('renders the page title as a text input', () => {
        renderList();

        expect(screen.getByRole('textbox', { name: 'Page Title' })).toBeTruthy();
    });
});
