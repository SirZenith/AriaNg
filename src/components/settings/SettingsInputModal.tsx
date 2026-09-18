import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/Modal';

interface SettingsInputModalProps {
    title: string;
    value: string;
    inputType?: 'text' | 'number';
    history?: string[];
    required?: boolean;
    suffix?: string;
    onConfirm: (value: string) => void;
    onClose: () => void;
}

const historyListId = 'settings-input-history';

export default function SettingsInputModal({
    title,
    value,
    inputType = 'text',
    history = [],
    required = false,
    suffix,
    onConfirm,
    onClose,
}: SettingsInputModalProps) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState(value);

    const confirm = () => {
        if (required && draft === '') {
            return;
        }

        onConfirm(draft);
        onClose();
    };

    return (
        <Modal
            title={title}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                        {t('Cancel')}
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={confirm}>
                        {t('Confirm')}
                    </button>
                </>
            }
        >
            <div className="flex items-center gap-2">
                <input
                    autoFocus
                    className="input min-w-0"
                    type={inputType}
                    value={draft}
                    list={history.length > 0 ? historyListId : undefined}
                    onChange={(event) => setDraft(event.target.value)}
                />
                {suffix ? <span className="shrink-0 text-xs text-gray-500">{t(suffix)}</span> : null}
            </div>
            {history.length > 0 ? (
                <datalist id={historyListId}>
                    {history.map((item) => (
                        <option key={item} value={item} />
                    ))}
                </datalist>
            ) : null}
        </Modal>
    );
}
