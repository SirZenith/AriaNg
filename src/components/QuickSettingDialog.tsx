import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import SettingsCard from './settings/SettingsCard';
import Aria2OptionItemList from '@/features/settings/Aria2OptionItemList';
import { aria2SettingService } from '@/services/aria2SettingService';

interface QuickSettingDialogProps {
    type: string;
    title: string;
    onClose: () => void;
}

export default function QuickSettingDialog({ type, title, onClose }: QuickSettingDialogProps) {
    const { t } = useTranslation();
    const [values, setValues] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const options = useMemo(() => {
        const keys = aria2SettingService.getAria2QuickSettingsAvailableOptions(type);

        return Array.isArray(keys) ? aria2SettingService.getSpecifiedOptions(keys) : [];
    }, [type]);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const response = await aria2SettingService.getGlobalOption();

            if (cancelled) {
                return;
            }

            if (response.success && response.data) {
                setValues(response.data as Record<string, string>);
            }

            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const changeOption = async (key: string, value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
        await aria2SettingService.setGlobalOption(key, value);
    };

    return (
        <Modal title={t(title)} onClose={onClose}>
            {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">{t('Loading')}</div>
            ) : (
                <SettingsCard>
                    <Aria2OptionItemList
                        options={options}
                        values={values}
                        onChange={(key, value) => void changeOption(key, value)}
                    />
                </SettingsCard>
            )}
        </Modal>
    );
}
