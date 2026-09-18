import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Switch from './Switch';

describe('Switch', () => {
    it('renders the checked state', () => {
        render(<Switch checked onChange={vi.fn()} aria-label="Toggle" />);

        expect(screen.getByRole('switch', { name: 'Toggle' }).getAttribute('aria-checked')).toBe('true');
    });

    it('calls onChange with the next value', () => {
        const onChange = vi.fn();
        render(<Switch checked={false} onChange={onChange} aria-label="Toggle" />);

        fireEvent.click(screen.getByRole('switch', { name: 'Toggle' }));

        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('does not fire when disabled', () => {
        const onChange = vi.fn();
        render(<Switch checked={false} onChange={onChange} disabled aria-label="Toggle" />);

        fireEvent.click(screen.getByRole('switch', { name: 'Toggle' }));

        expect(onChange).not.toHaveBeenCalled();
    });
});
