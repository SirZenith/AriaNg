import SettingsItem from './SettingsItem';

export interface SettingsChoiceItem {
    value: string;
    label: string;
}

interface SettingsChoiceListProps {
    items: SettingsChoiceItem[];
    value: string;
    onSelect: (value: string) => void;
}

export default function SettingsChoiceList({ items, value, onSelect }: SettingsChoiceListProps) {
    return (
        <div role="listbox" className="settings-card">
            {items.map((item) => {
                const selected = item.value === value;

                return (
                    <SettingsItem
                        key={item.value}
                        label={item.label}
                        indicator={{ type: 'check', selected }}
                        onClick={() => onSelect(item.value)}
                        role="option"
                        ariaSelected={selected}
                    />
                );
            })}
        </div>
    );
}
