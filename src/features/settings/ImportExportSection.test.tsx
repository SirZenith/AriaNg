import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithPanelBars } from '@/test-utils/renderWithPanelBars';
import ImportExportSection from './ImportExportSection';

vi.mock('@/services/settingService', () => ({
    exportAllOptions: vi.fn(() => ({})),
    importAllOptions: vi.fn(),
}));

vi.mock('@/services/notification', () => ({
    notifyInPage: vi.fn(),
}));

vi.mock('@/services/aria2SettingService', () => ({
    aria2SettingService: {
        clearSettingsHistorys: vi.fn(),
    },
}));

vi.mock('@/utils/file', () => ({
    downloadFile: vi.fn(),
    readFileAsText: vi.fn(async () => '{}'),
}));

vi.mock('@/utils/clipboard', () => ({
    copyText: vi.fn(async () => true),
}));

const actionLabels = ['Export Settings', 'Import Settings', 'Import', 'Clear Settings History', 'Reset Settings'];

describe('ImportExportSection', () => {
    it('renders all actions in the centered bottom bar', () => {
        renderWithPanelBars(<ImportExportSection onReset={vi.fn()} />);

        for (const label of actionLabels) {
            const action = screen.getByLabelText(label, { selector: 'label, button' });

            expect(action.className).toContain('bottom-bar-item');
            expect(action.closest('.bottom-bar-group')).toBeTruthy();
        }
    });

    it('hides the action labels on small screens', () => {
        renderWithPanelBars(<ImportExportSection onReset={vi.fn()} />);

        expect(screen.getByText('Export Settings').className).toContain('hidden md:inline');
        expect(screen.getByText('Reset Settings').className).toContain('hidden md:inline');
    });

    it('opens the export dialog from the bottom bar', () => {
        renderWithPanelBars(<ImportExportSection onReset={vi.fn()} />);

        fireEvent.click(screen.getByLabelText('Export Settings'));

        expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
    });

    it('triggers reset from the bottom bar', () => {
        const onReset = vi.fn();

        renderWithPanelBars(<ImportExportSection onReset={onReset} />);

        fireEvent.click(screen.getByLabelText('Reset Settings'));

        expect(onReset).toHaveBeenCalledTimes(1);
    });
});
