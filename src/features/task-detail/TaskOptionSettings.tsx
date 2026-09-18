import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsCard from '@/components/settings/SettingsCard';
import Aria2OptionItemList from '@/features/settings/Aria2OptionItemList';
import { aria2SettingService } from '@/services/aria2SettingService';
import { aria2TaskService } from '@/services/taskService';
import type { Aria2Task } from '@/types/aria2';

interface TaskOptionSettingsProps {
    task: Aria2Task;
}

export default function TaskOptionSettings({ task }: TaskOptionSettingsProps) {
    const { t } = useTranslation();
    const [values, setValues] = useState<Record<string, string>>({});

    const options = useMemo(
        () =>
            aria2SettingService.getSpecifiedOptions(
                aria2SettingService.getAvailableTaskOptionKeys(task.status, !!task.bittorrent),
                { disableRequired: true },
            ),
        [task.status, task.bittorrent],
    );

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const response = await aria2TaskService.getTaskOptions(task.gid);

            if (!cancelled && response.success && response.data) {
                setValues(response.data as Record<string, string>);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [task.gid]);

    const changeOption = async (key: string, value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
        await aria2TaskService.setTaskOption(task.gid, key, value);
    };

    return (
        <div>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t('Changes take effect immediately.')}</p>
            <SettingsCard>
                <Aria2OptionItemList
                    options={options}
                    values={values}
                    onChange={(key, value) => void changeOption(key, value)}
                />
            </SettingsCard>
        </div>
    );
}
