import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useTaskDetailStore } from '@/stores/taskDetailStore';

export default function TaskDetailToolbar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const gid = matchPath('/task/detail/:gid', location.pathname)?.params.gid;
    const taskName = useTaskDetailStore((state) => (state.gid === gid ? state.taskName : ''));

    return (
        <div className="mx-auto flex w-full max-w-[1000px] items-center gap-x-1">
            <button
                type="button"
                className="flex shrink-0 items-center rounded p-1.5 hover:bg-white/10"
                title={t('Back')}
                aria-label={t('Back')}
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {taskName ? (
                <span className="min-w-0 flex-1 truncate text-sm font-medium" title={taskName}>
                    {taskName}
                </span>
            ) : null}
        </div>
    );
}
