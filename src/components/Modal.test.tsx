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

    it('applies the shared modal panel style', () => {
        render(
            <Modal title="Global Rate Limit" onClose={vi.fn()}>
                <span>Content</span>
            </Modal>,
        );

        const panel = screen.getByText('Global Rate Limit').closest('.modal-panel');

        expect(panel).toBeTruthy();
    });
});
