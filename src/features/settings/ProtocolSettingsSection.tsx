import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import OptionForm from '@/components/OptionForm';
import { aria2SettingService } from '@/services/aria2SettingService';
import { protocolCategories } from './protocolCategories';

interface ProtocolSettingsSectionProps {
    initialType: string;
    hideTabs?: boolean;
    options: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export default function ProtocolSettingsSection({
    initialType,
    hideTabs = false,
    options,
    onChange,
}: ProtocolSettingsSectionProps) {
    const { t } = useTranslation();
    const [currentType, setCurrentType] = useState(initialType);

    const optionItems = useMemo(() => {
        const keys = aria2SettingService.getAvailableGlobalOptionsKeys(currentType);

        return Array.isArray(keys) ? aria2SettingService.getSpecifiedOptions(keys) : [];
    }, [currentType]);

    return (
        <div>
            {hideTabs ? null : (
                <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                    {protocolCategories.map((category) => (
                        <button
                            key={category.key}
                            type="button"
                            className={
                                'rounded px-2 py-1 text-sm ' +
                                (currentType === category.key
                                    ? 'bg-[#3c8dbc] text-white'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300')
                            }
                            onClick={() => setCurrentType(category.key)}
                        >
                            {t(category.label)}
                        </button>
                    ))}
                </div>
            )}

            <OptionForm options={optionItems} values={options} onChange={onChange} />
        </div>
    );
}
