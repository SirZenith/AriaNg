import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { aria2SettingService } from '@/services/aria2SettingService';
import Aria2OptionValuePage from './Aria2OptionValuePage';
import useAria2GlobalOptions from './useAria2GlobalOptions';

export default function Aria2OptionValueRoutePage({ category }: { category: string }) {
    const { t } = useTranslation();
    const { option: optionKey } = useParams();
    const { globalOptions, changeOption } = useAria2GlobalOptions();

    const option = useMemo(() => {
        const keys = aria2SettingService.getAvailableGlobalOptionsKeys(category);

        if (!Array.isArray(keys)) {
            return undefined;
        }

        return aria2SettingService.getSpecifiedOptions(keys).find((entry) => entry.key === optionKey);
    }, [category, optionKey]);

    if (!option || !option.options || option.options.length < 1) {
        return <div className="panel p-6 text-center text-sm text-gray-500">{t('No Data')}</div>;
    }

    return (
        <Aria2OptionValuePage
            option={option}
            value={globalOptions[option.key] ?? option.defaultValue ?? ''}
            onChange={(key, value) => void changeOption(key, value)}
        />
    );
}
