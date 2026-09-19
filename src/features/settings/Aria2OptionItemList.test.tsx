import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { Aria2OptionItem } from '@/services/aria2SettingService';
import Aria2OptionItemList from './Aria2OptionItemList';

const booleanOption: Aria2OptionItem = {
    key: 'check-integrity',
    nameKey: 'Check Integrity',
    descriptionKey: '',
    type: 'boolean',
};

const choiceOption: Aria2OptionItem = {
    key: 'file-allocation',
    nameKey: 'File Allocation',
    descriptionKey: '',
    type: 'option',
    options: [
        { name: 'None', value: 'none' },
        { name: 'Prealloc', value: 'prealloc' },
    ],
};

const textOption: Aria2OptionItem = {
    key: 'dir',
    nameKey: 'Dir',
    descriptionKey: '',
    type: 'string',
};

function renderList(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Aria2OptionItemList', () => {
    it('toggles a boolean option through a switch', () => {
        const onChange = vi.fn();

        renderList(
            <Aria2OptionItemList
                options={[booleanOption]}
                values={{ 'check-integrity': 'false' }}
                onChange={onChange}
            />,
        );

        fireEvent.click(screen.getByRole('switch'));

        expect(onChange).toHaveBeenCalledWith('check-integrity', 'true');
    });

    it('links a choice option to its value page when a route base is provided', () => {
        renderList(
            <Aria2OptionItemList
                routeBase="/settings/basic"
                options={[choiceOption]}
                values={{ 'file-allocation': 'none' }}
                onChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('link').getAttribute('href')).toBe('/settings/basic/file-allocation');
    });

    it('opens a choice modal when no route base is provided', () => {
        const onChange = vi.fn();

        renderList(
            <Aria2OptionItemList options={[choiceOption]} values={{ 'file-allocation': 'none' }} onChange={onChange} />,
        );

        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByRole('option', { name: 'Prealloc' }));

        expect(onChange).toHaveBeenCalledWith('file-allocation', 'prealloc');
    });

    it('opens an input modal for a text option', () => {
        const onChange = vi.fn();

        renderList(<Aria2OptionItemList options={[textOption]} values={{ dir: '/downloads' }} onChange={onChange} />);

        fireEvent.click(screen.getByRole('button'));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: '/tmp' } });
        fireEvent.click(screen.getByText('Confirm'));

        expect(onChange).toHaveBeenCalledWith('dir', '/tmp');
    });
});
