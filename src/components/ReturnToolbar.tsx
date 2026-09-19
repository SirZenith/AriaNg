import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ReturnToolbarArgs {
    title: string;
    to?: string;
    state?: unknown;
}

export default function ReturnToolbar({ title, to, state }: ReturnToolbarArgs) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="toolbar-title-container">
            <button
                type="button"
                className="toolbar-icon-btn"
                title={t('Back')}
                aria-label={t('Back')}
                onClick={() => (to ? navigate(to, state === undefined ? undefined : { state }) : navigate(-1))}
            >
                <ChevronLeft className="h-7 w-7" aria-hidden="true" />
            </button>
            <span className="toolbar-title-text">{t(title)}</span>
        </div>
    );
}
