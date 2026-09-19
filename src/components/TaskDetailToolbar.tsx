import { ChevronLeft } from 'lucide-react';
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
                className="toolbar-icon-btn"
                title={t('Back')}
                aria-label={t('Back')}
                onClick={() => navigate(-1)}
            >
                <ChevronLeft className="h-7 w-7" aria-hidden="true" />
            </button>
            {taskName ? (
                <span className="min-w-0 flex-1 truncate text-sm font-medium" title={taskName}>
                    {taskName}
                </span>
            ) : null}
        </div>
    );
}
