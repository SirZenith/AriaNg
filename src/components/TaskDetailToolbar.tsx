import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function TaskDetailToolbar() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="mx-auto flex w-full max-w-[1000px] items-center">
            <button
                type="button"
                className="flex shrink-0 items-center rounded p-1.5 hover:bg-white/10"
                title={t('Back')}
                aria-label={t('Back')}
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
        </div>
    );
}
