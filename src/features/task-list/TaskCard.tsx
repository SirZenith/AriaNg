import { type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, Copy, Eye, Network } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import type { Aria2Task } from '@/types/aria2';
import { formatDuration, formatPercent, formatVolume } from '@/utils/format';
import { getTaskStatusIcon, isTaskRetryable } from '@/utils/task';

interface TaskCardProps {
    task: Aria2Task;
    isDraggable: boolean;
    onRetry: (task: Aria2Task) => void;
    onCopyDownloadUrl: (task: Aria2Task) => void;
    onContextMenu: (event: MouseEvent<HTMLDivElement>, task: Aria2Task) => void;
}

export default function TaskCard({ task, isDraggable, onRetry, onCopyDownloadUrl, onContextMenu }: TaskCardProps) {
    const { t } = useTranslation();
    const isSelected = useTaskStore((state) => !!state.selected[task.gid]);
    const toggleSelected = useTaskStore((state) => state.toggleSelected);

    const completePercent = Number(task.completePercent || 0);
    const StatusIcon = getTaskStatusIcon(task, true);
    const isActive = task.status === 'active';
    const isError = task.status === 'error';
    const showRemainTime = isActive && task.remainTime !== undefined && task.remainTime >= 0 && task.remainTime < 86400;

    return (
        <SortableTaskRow task={task} isDraggable={isDraggable}>
            {({ handleProps }) => (
                <div
                    className={
                        'flex h-full cursor-pointer flex-col gap-2 rounded-lg border bg-white p-3 text-sm shadow-sm transition-colors dark:bg-gray-800 ' +
                        (isSelected
                            ? 'border-[#3c8dbc] ring-1 ring-[#3c8dbc]/40'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600')
                    }
                    onClick={() => toggleSelected(task.gid)}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        onContextMenu(event, task);
                    }}
                >
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={isSelected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggleSelected(task.gid)}
                        />

                        <div className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-medium" title={task.taskName}>
                                {task.taskName}
                            </span>
                        </div>

                        <Link
                            to={'/task/detail/' + task.gid}
                            className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            title={t('Click to view task detail')}
                            aria-label={t('Click to view task detail')}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>

                        <button
                            type="button"
                            className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            title={t('Copy Download Url')}
                            aria-label={t('Copy Download Url')}
                            onClick={(event) => {
                                event.stopPropagation();
                                onCopyDownloadUrl(task);
                            }}
                        >
                            <Copy className="h-4 w-4" aria-hidden="true" />
                        </button>

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
                        <div className="h-2 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <div
                                className={isError ? 'h-full bg-amber-500' : 'h-full bg-[#3c8dbc]'}
                                style={{ width: Math.min(100, completePercent) + '%' }}
                            />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                                {formatVolume(Number(task.totalLength))}
                                {task.files
                                    ? ` (${t('format.settings.file-count', { count: task.selectedFileCount })})`
                                    : ''}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                                {showRemainTime ? formatDuration(Number(task.remainTime), 'HH:mm:ss') : ''}
                            </span>
                            <span className="font-medium">{formatPercent(completePercent, 2) + '%'}</span>
                        </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <div className="flex flex-1 flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                {StatusIcon ? <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                            </span>
                            {isError && task.errorDescription ? (
                                <span className="text-red-600" title={t(task.errorDescription)}>
                                    &#10005;
                                </span>
                            ) : null}
                            {isTaskRetryable(task) ? (
                                <button
                                    type="button"
                                    className="rounded bg-[#3c8dbc] px-2 py-0.5 text-xs text-white hover:bg-[#367fa9]"
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
                        <div className="flex flex-1 items-center justify-end gap-1">
                            <span className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-green-600 dark:bg-gray-700 dark:text-green-500">
                                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                                {isActive ? formatVolume(Number(task.downloadSpeed)) + '/s' : '-'}
                            </span>
                            <span className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-blue-500 dark:bg-gray-700 dark:text-blue-400">
                                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                                {isActive ? formatVolume(Number(task.uploadSpeed)) + '/s' : '-'}
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
