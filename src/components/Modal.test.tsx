import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

describe('Modal', () => {
    it('renders into document.body instead of the parent container', () => {
        const { container } = render(
            <div className="text-xs text-white">
                <Modal title="Global Rate Limit" onClose={vi.fn()}>
                    <span>Content</span>
                </Modal>
            </div>,
        );

        expect(container.textContent).toBe('');
        expect(screen.getByText('Global Rate Limit')).toBeTruthy();
        expect(screen.getByText('Content')).toBeTruthy();
    });

    it('sets its own text color on the panel', () => {
        render(
            <Modal title="Global Rate Limit" onClose={vi.fn()}>
                <span>Content</span>
            </Modal>,
        );

        const panel = screen.getByText('Global Rate Limit').closest('div.bg-white');

        expect(panel?.className).toContain('text-gray-800');
        expect(panel?.className).toContain('dark:text-gray-100');
    });
});
