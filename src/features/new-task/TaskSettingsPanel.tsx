import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import OptionForm from '@/components/OptionForm';
import { aria2SettingService, type Aria2OptionItem } from '@/services/aria2SettingService';

interface TaskSettingsPanelProps {
    options: Aria2OptionItem[];
    values: Record<string, string>;
    onConfirm: (values: Record<string, string>) => void;
    onClose: () => void;
}

export default function TaskSettingsPanel({ options, values, onConfirm, onClose }: TaskSettingsPanelProps) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...values }));

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

    return (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 sm:items-center sm:p-4">
            <div className="flex w-full max-w-3xl flex-col bg-white shadow-xl dark:bg-gray-800 sm:max-h-[85vh] sm:rounded">
                <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <button
                        type="button"
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={t('Back')}
                        aria-label={t('Back')}
                        onClick={onClose}
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <span className="text-base font-semibold">{t('Task Settings')}</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <OptionForm options={options} values={draft} onChange={setValue} />
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                    <button
                        type="button"
                        className="rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600"
                        onClick={onClose}
                    >
                        {t('Back')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary px-4 py-2"
                        onClick={() => {
                            onConfirm(draft);
                            onClose();
                        }}
                    >
                        {t('Confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
