import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ariaNgDefaultOptions } from '@/config/constants';
import { useSettingStore } from '@/stores/settingStore';
import AriaNgGeneralSettingsItemList from './AriaNgGeneralSettingsItemList';

function renderList() {
    return render(
        <MemoryRouter>
            <AriaNgGeneralSettingsItemList />
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

        expect(link.getAttribute('href')).toBe('/ariang/general/theme');
        expect(link.textContent).toContain('Light');
    });

    it('toggles a boolean setting with a switch', () => {
        renderList();

        fireEvent.click(screen.getByRole('switch', { name: 'Keyboard Shortcuts' }));

        expect(useSettingStore.getState().options.keyboardShortcuts).toBe(false);
    });

    it('edits the page title through the input modal', () => {
        renderList();

        fireEvent.click(screen.getByText('Page Title'));

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My AriaNg' } });
        fireEvent.click(screen.getByText('Confirm'));

        expect(useSettingStore.getState().options.title).toBe('My AriaNg');
    });
});
