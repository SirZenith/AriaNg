import { useTranslation } from 'react-i18next';
import Switch from './Switch';
import type { Aria2OptionItem } from '@/services/aria2SettingService';
import { getSettingHistory } from '@/services/settingService';

interface OptionFormProps {
    options: Aria2OptionItem[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

const inputClass = 'input';

export default function OptionForm({ options, values, onChange }: OptionFormProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-3">
            {options.map((option) => {
                const value = values[option.key] ?? option.defaultValue ?? '';
                const description = t(option.descriptionKey);
                const history = option.showHistory ? getSettingHistory(option.key) : [];

                return (
                    <div key={option.key} className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:items-start">
                        <label className="pt-1 text-sm font-medium" title={description}>
                            {t(option.nameKey)}
                            {option.required ? ' *' : ''}
                        </label>
                        <div className="sm:col-span-2">
                            {option.type === 'boolean' ? (
                                <Switch
                                    checked={value === 'true'}
                                    disabled={option.readonly}
                                    onChange={(checked) => onChange(option.key, checked ? 'true' : 'false')}
                                    aria-label={t(option.nameKey)}
                                />
                            ) : option.options && option.options.length > 0 ? (
                                <select
                                    className={inputClass}
                                    value={value}
                                    disabled={option.readonly}
                                    onChange={(event) => onChange(option.key, event.target.value)}
                                >
                                    <option value="" disabled>
                                        --
                                    </option>
                                    {option.options.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {t(item.name)}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className={inputClass}
                                    type={option.type === 'integer' || option.type === 'float' ? 'number' : 'text'}
                                    value={value}
                                    disabled={option.readonly}
                                    list={history.length > 0 ? option.key + '-history' : undefined}
                                    onChange={(event) => onChange(option.key, event.target.value)}
                                />
                            )}
                            {history.length > 0 && !option.options ? (
                                <datalist id={option.key + '-history'}>
                                    {history.map((item) => (
                                        <option key={item} value={item} />
                                    ))}
                                </datalist>
                            ) : null}
                            {description ? (
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
