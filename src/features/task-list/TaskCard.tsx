import { type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, Eye, Files, Network } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import type { Aria2Task } from '@/types/aria2';
import { formatDuration, formatPercent, formatVolume } from '@/utils/format';
import {
    getTaskStatusBgClass,
    getTaskStatusColorClass,
    getTaskStatusColorValue,
    getTaskStatusIcon,
    getTaskStatusIconBgClass,
    isTaskRetryable,
} from '@/utils/task';

interface TaskCardProps {
    task: Aria2Task;
    isDraggable: boolean;
    onRetry: (task: Aria2Task) => void;
    onContextMenu: (event: MouseEvent<HTMLDivElement>, task: Aria2Task) => void;
}

export default function TaskCard({ task, isDraggable, onRetry, onContextMenu }: TaskCardProps) {
    const { t } = useTranslation();
    const isSelected = useTaskStore((state) => !!state.selected[task.gid]);
    const toggleSelected = useTaskStore((state) => state.toggleSelected);

    const completePercent = Number(task.completePercent || 0);
    const StatusIcon = getTaskStatusIcon(task);
    const isActive = task.status === 'active';
    const isError = task.status === 'error';
    const showRemainTime = isActive && task.remainTime !== undefined && task.remainTime >= 0 && task.remainTime < 86400;

    const statusBgClass = getTaskStatusBgClass(task);
    const statusTextClass = getTaskStatusColorClass(task);

    const statusIconClass = statusTextClass;
    const statusIconBgClass = getTaskStatusIconBgClass(task);

    const progressTextClass = statusTextClass;
    const progressBarClass = statusBgClass;

    return (
        <SortableTaskRow task={task} isDraggable={isDraggable}>
            {({ handleProps }) => (
                <div
                    className={
                        'card flex h-full cursor-pointer items-stretch gap-3 p-3 text-sm ' +
                        (isSelected ? 'card-selected' : 'card-interactive')
                    }
                    style={{ '--task-status-color': getTaskStatusColorValue(task) } as CSSProperties}
                    onClick={() => toggleSelected(task.gid)}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        onContextMenu(event, task);
                    }}
                >
                    <div className={`${statusIconBgClass} flex shrink-0 items-center rounded-lg p-1`}>
                        {StatusIcon ? <StatusIcon className={'h-6 w-6 ' + statusIconClass} aria-hidden="true" /> : null}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                                <span className="line-clamp-2 font-medium" title={task.taskName}>
                                    {task.taskName}
                                </span>
                            </div>

                            <Link
                                to={'/task/detail/' + task.gid}
                                className="icon-btn"
                                title={t('Click to view task detail')}
                                aria-label={t('Click to view task detail')}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                            </Link>

                            {isDraggable ? (
                                <span
                                    className="cursor-grab touch-none select-none text-gray-400 hover:text-gray-600"
                                    title={t('Change Tasks Order by Drag-and-drop')}
                                    {...handleProps}
                                >
                                    &#8942;&#8942;
                                </span>
                            ) : null}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className={'h-full rounded-full ' + progressBarClass}
                                        style={{ width: Math.min(100, completePercent) + '%' }}
                                    />
                                </div>
                                <span className={'shrink-0 text-xs font-medium ' + progressTextClass}>
                                    {formatPercent(completePercent, 2) + '%'}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                    {formatVolume(Number(task.totalLength))}
                                    {task.files ? (
                                        <span
                                            className="flex items-center gap-0.5"
                                            title={t('format.settings.file-count', {
                                                count: task.selectedFileCount,
                                            })}
                                        >
                                            <Files className="h-3.5 w-3.5" aria-hidden="true" />
                                            {task.selectedFileCount}
                                        </span>
                                    ) : null}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                    {showRemainTime ? formatDuration(Number(task.remainTime), 'HH:mm:ss') : ''}
                                </span>
                            </div>
                        </div>

                        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="chip chip-download bg-transparent pl-0 dark:bg-transparent">
                                    <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span className="w-22 whitespace-nowrap">
                                        {isActive ? formatVolume(Number(task.downloadSpeed)) + '/s' : '-'}
                                    </span>
                                </span>
                                <span className="chip chip-upload bg-transparent pl-0 dark:bg-transparent">
                                    <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span className="w-22 whitespace-nowrap">
                                        {isActive ? formatVolume(Number(task.uploadSpeed)) + '/s' : '-'}
                                    </span>
                                </span>
                            </div>
                            <div className="flex flex-1 flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                {isError && task.errorDescription ? (
                                    <span className="text-red-600" title={t(task.errorDescription)}>
                                        &#10005;
                                    </span>
                                ) : null}
                                {isTaskRetryable(task) ? (
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onRetry(task);
                                        }}
                                    >
                                        {t('Retry')}
                                    </button>
                                ) : null}
                            </div>
                            <span
                                className="flex shrink-0 items-center gap-1 text-gray-500 dark:text-gray-400"
                                title={t('Connections')}
                            >
                                <Network className="h-3.5 w-3.5" aria-hidden="true" />
                                {`${task.connections ?? 0}/${task.numSeeders ?? 0}`}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </SortableTaskRow>
    );
}

interface SortableTaskRowProps {
    task: Aria2Task;
    isDraggable: boolean;
    children: (props: { handleProps: Record<string, unknown> }) => ReactNode;
}

function SortableTaskRow({ task, isDraggable, children }: SortableTaskRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.gid,
        disabled: !isDraggable,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            {children({ handleProps: { ...attributes, ...listeners } })}
        </div>
    );
}
