import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import SplitBottomBar from './SplitBottomBar';

describe('SplitBottomBar', () => {
    it('renders leading and trailing groups', () => {
        renderWithPanelBars(
            <SplitBottomBar
                leading={<button type="button">Start</button>}
                trailing={<button type="button">Task Settings</button>}
            />,
        );

        expect(screen.getByText('Start').closest('.bottom-bar-group')).toBeTruthy();
        expect(screen.getByText('Task Settings').closest('.bottom-bar-group')).toBeTruthy();
        expect(document.querySelectorAll('.bottom-bar-group')).toHaveLength(2);
        expect(document.querySelector('.bottom-bar-split')?.className).toContain('justify-between');
    });

    it('renders only the leading group when trailing is omitted', () => {
        renderWithPanelBars(<SplitBottomBar leading={<button type="button">Start</button>} />);

        expect(screen.getByText('Start')).toBeTruthy();
        expect(document.querySelectorAll('.bottom-bar-group')).toHaveLength(1);
        expect(document.querySelector('.bottom-bar-split')?.className).toContain('justify-center');
    });
});
