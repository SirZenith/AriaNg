import { useTranslation } from 'react-i18next';
import Switch from '@/components/Switch';
import type { Aria2OptionItem } from '@/services/aria2SettingService';
import SettingsRow from './SettingsRow';

interface Aria2OptionItemListProps {
    routeBase: string;
    options: Aria2OptionItem[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export default function Aria2OptionItemList({ routeBase, options, values, onChange }: Aria2OptionItemListProps) {
    const { t } = useTranslation();

    return (
        <div className="overflow-hidden">
            {options.map((option) => {
                const value = values[option.key] ?? option.defaultValue ?? '';
                const name = t(option.nameKey);
                const description = t(option.descriptionKey);

                if (option.type === 'boolean') {
                    return (
                        <SettingsRow key={option.key} label={name} description={description}>
                            <Switch
                                checked={value === 'true'}
                                disabled={option.readonly}
                                onChange={(checked) => onChange(option.key, checked ? 'true' : 'false')}
                                aria-label={name}
                            />
                        </SettingsRow>
                    );
                }

                if (option.options && option.options.length > 0) {
                    const current = option.options.find((choice) => choice.value === value);

                    return (
                        <SettingsRow
                            key={option.key}
                            label={name}
                            description={description}
                            valueText={current ? t(current.name) : value}
                            to={routeBase + '/' + option.key}
                        />
                    );
                }

                return (
                    <div
                        key={option.key}
                        className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-700"
                    >
                        <label htmlFor={'option-' + option.key} className="mb-1 block text-sm font-medium">
                            {name}
                            {option.required ? ' *' : ''}
                        </label>
                        <input
                            id={'option-' + option.key}
                            className="input"
                            type={option.type === 'integer' || option.type === 'float' ? 'number' : 'text'}
                            value={value}
                            disabled={option.readonly}
                            onChange={(event) => onChange(option.key, event.target.value)}
                        />
                        {description ? (
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
