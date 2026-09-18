import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsInputModal from './SettingsInputModal';

describe('SettingsInputModal', () => {
    it('confirms the edited value and closes', () => {
        const onConfirm = vi.fn();
        const onClose = vi.fn();

        render(<SettingsInputModal title="Page Title" value="AriaNg" onConfirm={onConfirm} onClose={onClose} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My AriaNg' } });
        fireEvent.click(screen.getByText('Confirm'));

        expect(onConfirm).toHaveBeenCalledWith('My AriaNg');
        expect(onClose).toHaveBeenCalled();
    });

    it('does not confirm an empty required value', () => {
        const onConfirm = vi.fn();

        render(<SettingsInputModal title="Dir" value="dir" required onConfirm={onConfirm} onClose={vi.fn()} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
        fireEvent.click(screen.getByText('Confirm'));

        expect(onConfirm).not.toHaveBeenCalled();
    });
});
