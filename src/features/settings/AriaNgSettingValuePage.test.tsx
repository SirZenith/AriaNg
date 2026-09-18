import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ariaNgDefaultOptions } from '@/config/constants';
import { useSettingStore } from '@/stores/settingStore';
import AriaNgSettingValuePage from './AriaNgSettingValuePage';

afterEach(() => {
    window.localStorage.clear();
    useSettingStore.setState({ options: ariaNgDefaultOptions });
});

describe('AriaNgSettingValuePage', () => {
    it('shows all choices and marks the current value', () => {
        render(<AriaNgSettingValuePage settingKey="theme" />);

        expect(screen.getByRole('option', { name: 'Light', selected: true })).toBeTruthy();
        expect(screen.getByRole('option', { name: 'Dark', selected: false })).toBeTruthy();
    });

    it('updates the setting and keeps the selection visible', () => {
        render(<AriaNgSettingValuePage settingKey="theme" />);

        fireEvent.click(screen.getByRole('option', { name: 'Dark' }));

        expect(useSettingStore.getState().options.theme).toBe('dark');
        expect(screen.getByRole('option', { name: 'Dark', selected: true })).toBeTruthy();
    });
});
