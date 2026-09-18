import { Check } from 'lucide-react';

export interface OptionChoiceItem {
    value: string;
    label: string;
}

interface OptionChoiceListProps {
    items: OptionChoiceItem[];
    value: string;
    onSelect: (value: string) => void;
}

export default function OptionChoiceList({ items, value, onSelect }: OptionChoiceListProps) {
    return (
        <div role="listbox" className="overflow-hidden rounded-xl bg-white shadow dark:bg-gray-800">
            {items.map((item) => {
                const selected = item.value === value;

                return (
                    <button
                        key={item.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                        onClick={() => onSelect(item.value)}
                    >
                        <span
                            className={
                                'min-w-0 flex-1 truncate ' +
                                (selected ? 'font-medium text-primary' : 'text-gray-700 dark:text-gray-200')
                            }
                        >
                            {item.label}
                        </span>
                        {selected ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                    </button>
                );
            })}
        </div>
    );
}
