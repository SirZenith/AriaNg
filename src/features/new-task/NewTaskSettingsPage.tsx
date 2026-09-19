import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CenteredBottomBar from '@/components/CenteredBottomBar';
import ReturnToolbar from '@/components/ReturnToolbar';
import SettingsCard from '@/components/settings/SettingsCard';
import TopBar from '@/components/TopBar';
import Aria2OptionItemList from '@/features/settings/Aria2OptionItemList';
import { aria2SettingService } from '@/services/aria2SettingService';
import { useNewTaskStore } from '@/stores/newTaskStore';

export default function NewTaskSettingsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const storedOptions = useNewTaskStore((state) => state.options);
    const setOptions = useNewTaskStore((state) => state.setOptions);
    const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...storedOptions }));

    const availableOptions = useMemo(
        () =>
            aria2SettingService.getSpecifiedOptions(aria2SettingService.getNewTaskOptionKeys(), {
                disableRequired: true,
            }),
        [],
    );

    const setValue = (key: string, value: string) => {
        setDraft((current) => {
            const next = { ...current };

            if (value === '' && !aria2SettingService.isOptionKeyRequired(key)) {
                delete next[key];
            } else {
                next[key] = value;
            }

            return next;
        });
    };

    const confirm = () => {
        setOptions(draft);
        navigate('/new');
    };

    return (
        <>
            <TopBar>
                <ReturnToolbar title="Task Settings" to="/new" />
            </TopBar>

            <SettingsCard>
                <Aria2OptionItemList options={availableOptions} values={draft} onChange={setValue} />
            </SettingsCard>

            <CenteredBottomBar>
                <button type="button" className="bottom-bar-item px-6" onClick={confirm}>
                    {t('Confirm')}
                </button>
            </CenteredBottomBar>
        </>
    );
}
