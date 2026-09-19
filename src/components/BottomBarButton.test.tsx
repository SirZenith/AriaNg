import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { Plus, Search } from 'lucide-react';
import BottomBarButton from './BottomBarButton';

function renderWithRouter(ui: ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('BottomBarButton', () => {
    it('renders a button with icon and label, and handles click', () => {
        const onClick = vi.fn();

        renderWithRouter(<BottomBarButton ariaLabel="Start" label="Start" icon={Plus} onClick={onClick} />);

        const button = screen.getByRole('button', { name: 'Start' });

        expect(button.className).toContain('bottom-bar-item');
        expect(button.getAttribute('title')).toBe('Start');
        expect(button.querySelector('svg')).toBeTruthy();
        expect(screen.getByText('Start').className).toContain('hidden md:inline');

        fireEvent.click(button);

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders a disabled button', () => {
        renderWithRouter(<BottomBarButton ariaLabel="Delete" label="Delete" disabled onClick={vi.fn()} />);

        expect((screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('renders a link when to is provided', () => {
        renderWithRouter(<BottomBarButton to="/new" state={{ from: '/' }} ariaLabel="New" label="New" />);

        expect(screen.getByRole('link', { name: 'New' }).getAttribute('href')).toBe('/new');
    });

    it('renders a label element when there is no to or onClick', () => {
        renderWithRouter(
            <BottomBarButton ariaLabel="Import Settings" label="Import Settings">
                <input type="file" aria-hidden="true" />
            </BottomBarButton>,
        );

        const label = screen.getByLabelText('Import Settings', { selector: 'label' });

        expect(label.tagName).toBe('LABEL');
        expect(label.querySelector('input[type="file"]')).toBeTruthy();
    });

    it('keeps the label visible when hideLabelOnMobile is false', () => {
        renderWithRouter(
            <BottomBarButton ariaLabel="Confirm" label="Confirm" hideLabelOnMobile={false} onClick={vi.fn()} />,
        );

        expect(screen.getByText('Confirm').className).not.toContain('hidden md:inline');
    });

    it('renders an icon-only button without a visible label', () => {
        renderWithRouter(<BottomBarButton ariaLabel="Search" icon={Search} onClick={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Search' }).querySelector('span')).toBeNull();
    });
});
