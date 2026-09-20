import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical, Maximize2, Files, Network, RotateCcw } from 'lucide-react';
import { ariaNgConstants } from '@/config/constants';
import { useTaskStore } from '@/stores/taskStore';
import type { Aria2Task } from '@/types/aria2';
import { formatDuration, formatPercent, formatVolume } from '@/utils/format';
import {
    getTaskCardStatus,
    getTaskStatusBgClass,
    getTaskStatusColorClass,
    getTaskStatusColorValue,
    getTaskStatusIcon,
    getTaskStatusIconBgClass,
    isStoppedTask,
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
    const cardStatus = getTaskCardStatus(task);

    const [showErrorTooltip, setShowErrorTooltip] = useState(false);
    const longPressTimer = useRef<number | null>(null);

    const StatusIcon = getTaskStatusIcon(cardStatus);
    const statusBgClass = getTaskStatusBgClass(cardStatus);
    const statusTextClass = getTaskStatusColorClass(cardStatus);

    const statusIconClass = statusTextClass;
    const statusIconBgClass = getTaskStatusIconBgClass(cardStatus);

    const progressTextClass = statusTextClass;
    const progressBarClass = statusBgClass;

    const isActive = task.status === 'active';
    const isError = task.status === 'error';
    const isSeedingTask = cardStatus === 'seeding';
    const showRemainTime =
        isActive &&
        !isSeedingTask &&
        !isStoppedTask(task) &&
        task.remainTime !== undefined &&
        task.remainTime >= 0 &&
        task.remainTime < 86400;
    const showShareRatio = isSeedingTask;

    const showErrorMessage = isError && !!task.errorDescription;

    useEffect(() => {
        return () => {
            if (longPressTimer.current !== null) {
                window.clearTimeout(longPressTimer.current);
            }
        };
    }, []);

    const showError = () => {
        if (showErrorMessage) {
            setShowErrorTooltip(true);
        }
    };

    const hideError = () => {
        setShowErrorTooltip(false);
    };

    const cancelLongPress = () => {
        if (longPressTimer.current !== null) {
            window.clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const startLongPress = () => {
        if (!showErrorMessage) {
            return;
        }

        cancelLongPress();
        longPressTimer.current = window.setTimeout(() => {
            longPressTimer.current = null;
            setShowErrorTooltip(true);
        }, ariaNgConstants.errorTooltipDelay);
    };

    const handleErrorContextMenu = (event: MouseEvent<HTMLDivElement>) => {
        if (!showErrorMessage) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        cancelLongPress();
        setShowErrorTooltip(true);
    };

    return (
        <SortableTaskRow task={task} isDraggable={isDraggable}>
            {({ handleProps }) => (
                <div
                    className={
                        'card flex h-full cursor-pointer items-stretch gap-3 p-3 text-sm ' +
                        (isSelected ? 'card-selected' : 'card-interactive')
                    }
                    style={{ '--task-status-color': getTaskStatusColorValue(cardStatus) } as CSSProperties}
                    onClick={() => toggleSelected(task.gid)}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        onContextMenu(event, task);
                    }}
                >
                    <div
                        className={`${statusIconBgClass} relative flex shrink-0 items-center rounded-lg p-1`}
                        onMouseEnter={showError}
                        onMouseLeave={hideError}
                        onTouchStart={startLongPress}
                        onTouchEnd={hideError}
                        onTouchCancel={hideError}
                        onTouchMove={() => {
                            cancelLongPress();
                            hideError();
                        }}
                        onContextMenu={handleErrorContextMenu}
                    >
                        {StatusIcon ? <StatusIcon className={'h-6 w-6 ' + statusIconClass} aria-hidden="true" /> : null}
                        {showErrorTooltip && task.errorDescription ? (
                            <span
                                role="tooltip"
                                className="pointer-events-none absolute top-1/2 left-0 z-30 mt-4 w-max max-w-60 rounded-lg bg-gray-900 px-2 py-1 text-xs whitespace-normal text-white shadow-lg dark:bg-gray-700"
                            >
                                {t(task.errorDescription)}
                            </span>
                        ) : null}
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
                                className="icon-btn-outline"
                                title={t('Click to view task detail')}
                                aria-label={t('Click to view task detail')}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                            </Link>
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
                                    {showRemainTime
                                        ? formatDuration(Number(task.remainTime), 'HH:mm:ss')
                                        : showShareRatio
                                          ? `${t('Share Ratio')}: ${Number(task.shareRatio || 0).toFixed(3)}`
                                          : ''}
                                </span>
                            </div>
                        </div>

                        {isActive || (isStoppedTask(task) && isTaskRetryable(task)) ? (
                            <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                {isActive ? (
                                    <div className="flex items-center gap-0.5">
                                        <span className="chip chip-download bg-transparent pl-0 dark:bg-transparent">
                                            <ArrowDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            <span className="w-15 whitespace-nowrap">
                                                {formatVolume(Number(task.downloadSpeed)) + '/s'}
                                            </span>
                                        </span>
                                        <span className="chip chip-upload bg-transparent pl-0 dark:bg-transparent">
                                            <ArrowUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            <span className="w-15 whitespace-nowrap">
                                                {formatVolume(Number(task.uploadSpeed)) + '/s'}
                                            </span>
                                        </span>
                                    </div>
                                ) : null}
                                <div className="flex flex-1 flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400" />
                                {isStoppedTask(task) ? (
                                    isTaskRetryable(task) ? (
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-xs shrink-0"
                                            title={t('Retry')}
                                            aria-label={t('Retry')}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onRetry(task);
                                            }}
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                                        </button>
                                    ) : null
                                ) : (
                                    <span
                                        className="flex shrink-0 items-center gap-1 text-gray-500 dark:text-gray-400"
                                        title={t('Connections')}
                                    >
                                        <Network className="h-3.5 w-3.5" aria-hidden="true" />
                                        {`${task.connections ?? 0}/${task.numSeeders ?? 0}`}
                                    </span>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {isDraggable ? (
                        <span
                            className="-my-3 -mr-3 flex w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-r-xl border-l border-gray-100 text-gray-300 select-none hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing md:w-6 dark:border-gray-700/60 dark:text-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
                            title={t('Change Tasks Order by Drag-and-drop')}
                            aria-label={t('Change Tasks Order by Drag-and-drop')}
                            onClick={(event) => event.stopPropagation()}
                            {...handleProps}
                        >
                            <GripVertical className="h-6 w-6 md:h-5 md:w-5" aria-hidden="true" />
                        </span>
                    ) : null}
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
