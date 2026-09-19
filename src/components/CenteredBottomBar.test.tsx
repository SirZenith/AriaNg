import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import CenteredBottomBar from './CenteredBottomBar';

describe('CenteredBottomBar', () => {
    it('renders a single centered group', () => {
        renderWithPanelBars(
            <CenteredBottomBar>
                <button type="button">Confirm</button>
            </CenteredBottomBar>,
        );

        expect(screen.getByText('Confirm').closest('.bottom-bar-group')).toBeTruthy();
        expect(document.querySelectorAll('.bottom-bar-group')).toHaveLength(1);
        expect(document.querySelector('.bottom-bar-split')?.className).toContain('justify-center');
    });
});
