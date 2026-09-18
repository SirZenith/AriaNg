import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsChoiceList from './SettingsChoiceList';

describe('SettingsChoiceList', () => {
    it('marks the current value as selected and reports selection', () => {
        const onSelect = vi.fn();

        render(
            <SettingsChoiceList
                items={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                ]}
                value="light"
                onSelect={onSelect}
            />,
        );

        expect(screen.getByRole('option', { name: 'Light', selected: true })).toBeTruthy();

        fireEvent.click(screen.getByRole('option', { name: 'Dark' }));

        expect(onSelect).toHaveBeenCalledWith('dark');
    });
});
