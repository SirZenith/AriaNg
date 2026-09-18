import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Download, type LucideIcon } from 'lucide-react';
import ContextMenu, { type ContextMenuItem } from '@/components/ContextMenu';
import { useTaskListPolling } from '@/hooks/useAria2';
import { aria2TaskService } from '@/services/taskService';
import { notifyInPage } from '@/services/notification';
import { getAfterRetryingTask, getConfirmTaskRemoval, getDragAndDropTasks } from '@/services/settingService';
import { useSettingStore } from '@/stores/settingStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Aria2Task } from '@/types/aria2';
import { copyText } from '@/utils/clipboard';
import { formatDuration, formatPercent, formatVolume } from '@/utils/format';
import { filterTask, getTaskStatusKey, isTaskRetryable, orderTasks } from '@/utils/task';

interface ContextMenuState {
    x: number;
    y: number;
    task: Aria2Task;
}

const cardGridClass = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

const taskListTabs: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'downloading', label: 'Downloading', icon: Download },
    { key: 'waiting', label: 'Waiting', icon: Clock },
    { key: 'stopped', label: 'Finished / Stopped', icon: CheckCircle2 },
];

function buildMagnetLink(task: Aria2Task): string {
    const infoHash = task.infoHash ? String(task.infoHash) : '';
    const name = task.bittorrent?.info?.name || task.taskName || '';

    if (!infoHash) {
        return '';
    }

    return 'magnet:?xt=urn:btih:' + infoHash + (name ? '&dn=' + encodeURIComponent(name) : '');
}

export default function TaskListPage({ location }: { location: string }) {
    useTaskListPolling(location);

    const { t } = useTranslation();
    const navigate = useNavigate();
    const tasks = useTaskStore((state) => state.tasks);
    const selected = useTaskStore((state) => state.selected);
    const searchKeyword = useTaskStore((state) => state.searchKeyword);
    const toggleSelected = useTaskStore((state) => state.toggleSelected);
    const clearSelected = useTaskStore((state) => state.clearSelected);
    const setTasks = useTaskStore((state) => state.setTasks);
    const setPollingPaused = useTaskStore((state) => state.setPollingPaused);
    const globalStat = useTaskStore((state) => state.globalStat);
    const options = useSettingStore((state) => state.options);
    const setOption = useSettingStore((state) => state.setOption);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const taskCounts: Record<string, number> = {
        downloading: globalStat.numActive,
        waiting: globalStat.numWaiting,
        stopped: globalStat.numStopped,
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const orderType = options.taskListIndependentDisplayOrder
        ? location === 'waiting'
            ? options.waitingTaskListPageDisplayOrder
            : location === 'stopped'
                ? options.stoppedTaskListPageDisplayOrder
                : options.displayOrder
        : options.displayOrder;

    const visibleTasks = orderTasks(
        tasks.filter((task) => filterTask(task, searchKeyword)),
        orderType,
    );

    const selectedTasks = tasks.filter((task) => selected[task.gid]);
    const isDefaultOrder = orderType.indexOf('default') === 0;
    const isDraggable = location === 'waiting' && isDefaultOrder && getDragAndDropTasks();

    const changeDisplayOrder = (value: string) => {
        if (options.taskListIndependentDisplayOrder && location === 'waiting') {
            setOption('waitingTaskListPageDisplayOrder', value);
        } else if (options.taskListIndependentDisplayOrder && location === 'stopped') {
            setOption('stoppedTaskListPageDisplayOrder', value);
        } else {
            setOption('displayOrder', value);
        }
    };

    const retryTask = async (task: Aria2Task) => {
        const response = await aria2TaskService.retryTask(task.gid);
        const afterRetrying = getAfterRetryingTask();

        if (afterRetrying === 'task-detail' && response.success && typeof response.data === 'string') {
            navigate('/task/detail/' + response.data);
        } else if (afterRetrying === 'task-list-downloading') {
            navigate('/downloading');
        }
    };

    const removeTasks = async (targets: Aria2Task[]) => {
        if (targets.length < 1) {
            return;
        }

        if (getConfirmTaskRemoval() && !window.confirm(t('Are you sure you want to remove the selected tasks?'))) {
            return;
        }

        await aria2TaskService.removeTasks(targets);
        clearSelected();
    };

    const clearStoppedTasks = async () => {
        if (!window.confirm(t('Are you sure you want to clear stopped tasks?'))) {
            return;
        }

        await aria2TaskService.clearStoppedTasks();
    };

    const copyDownloadUrls = async (targets: Aria2Task[]) => {
        const urls = targets.map((task) => task.singleUrl).filter((url): url is string => !!url);

        if (urls.length < 1) {
            notifyInPage('Error', t('There is no url in selected tasks'), { type: 'error' });
            return;
        }

        if (await copyText(urls.join('\n'))) {
            notifyInPage('', t('Data has been copied to clipboard.'), { type: 'success' });
        }
    };

    const copyMagnetLinks = async (targets: Aria2Task[]) => {
        const links = targets.map((task) => buildMagnetLink(task)).filter((link) => !!link);

        if (links.length < 1) {
            notifyInPage('Error', t('There is no info hash in selected tasks'), { type: 'error' });
            return;
        }

        if (await copyText(links.join('\n'))) {
            notifyInPage('', t('Data has been copied to clipboard.'), { type: 'success' });
        }
    };

    const handleDragStart = (_event: DragStartEvent) => {
        setPollingPaused(true);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = visibleTasks.findIndex((task) => task.gid === active.id);
            const newIndex = visibleTasks.findIndex((task) => task.gid === over.id);

            if (oldIndex >= 0 && newIndex >= 0) {
                setTasks(arrayMove(visibleTasks, oldIndex, newIndex));

                await aria2TaskService.changeTaskPosition(
                    String(active.id),
                    newIndex,
                    () => {
                        setPollingPaused(false);
                    },
                    true,
                );

                return;
            }
        }

        setPollingPaused(false);
    };

    const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
        if (!contextMenu) {
            return [];
        }

        const task = contextMenu.task;
        const isOnTask = !!selected[task.gid];
        const targets = isOnTask ? selectedTasks : [task];
        const hasRetryable = targets.some((item) => isTaskRetryable(item));
        const hasPausable = targets.some((item) => item.status === 'active' || item.status === 'waiting');
        const hasResumable = targets.some((item) => item.status === 'paused');

        return [
            {
                label: t('Retry'),
                disabled: !hasRetryable,
                onClick: () => targets.filter((item) => isTaskRetryable(item)).forEach((item) => void retryTask(item)),
            },
            {
                label: t('Start'),
                disabled: !hasResumable,
                onClick: () => void aria2TaskService.startTasks(targets.map((item) => item.gid)),
            },
            {
                label: t('Pause'),
                disabled: !hasPausable,
                onClick: () => void aria2TaskService.pauseTasks(targets.map((item) => item.gid)),
            },
            { label: t('Delete'), onClick: () => void removeTasks(targets) },
            { divider: true, label: '' },
            { label: t('By File Name'), onClick: () => changeDisplayOrder('name:asc') },
            { label: t('By File Size'), onClick: () => changeDisplayOrder('size:asc') },
            { label: t('By Progress'), onClick: () => changeDisplayOrder('percent:desc') },
            { label: t('By Remaining'), onClick: () => changeDisplayOrder('remain:asc') },
            { label: t('By Download Speed'), onClick: () => changeDisplayOrder('dspeed:desc') },
            { label: t('Default'), onClick: () => changeDisplayOrder('default:asc') },
            { divider: true, label: '' },
            {
                label: t('Copy Download Url'),
                disabled: !targets.some((item) => item.singleUrl),
                onClick: () => void copyDownloadUrls(targets),
            },
            {
                label: t('Copy Magnet Link'),
                disabled: !targets.some((item) => item.infoHash),
                onClick: () => void copyMagnetLinks(targets),
            },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextMenu, selected, selectedTasks, t]);

    const renderCard = (task: Aria2Task) => {
        const completePercent = Number(task.completePercent || 0);
        const statusText = t(getTaskStatusKey(task, true), {
            errorcode: task.errorCode,
            verifiedPercent: task.verifiedPercent,
        });
        const isActive = task.status === 'active';
        const isSelected = !!selected[task.gid];
        const isError = task.status === 'error';
        const showRemainTime =
            isActive && task.remainTime !== undefined && task.remainTime >= 0 && task.remainTime < 86400;

        return (
            <SortableTaskRow key={task.gid} task={task} isDraggable={isDraggable}>
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
                            setContextMenu({ x: event.clientX, y: event.clientY, task });
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
                                <Link
                                    to={'/task/detail/' + task.gid}
                                    className="line-clamp-2 font-medium text-blue-600 hover:underline"
                                    title={task.taskName}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {task.taskName}
                                </Link>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{statusText}</span>
                                    {isError && task.errorDescription ? (
                                        <span className="text-red-600" title={t(task.errorDescription)}>
                                            &#10005;
                                        </span>
                                    ) : null}
                                    {isTaskRetryable(task) ? (
                                        <button
                                            type="button"
                                            className="text-blue-600 hover:underline"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                void retryTask(task);
                                            }}
                                        >
                                            {t('Retry')}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

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
                            <div className="h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                                <div
                                    className={isError ? 'h-full bg-amber-500' : 'h-full bg-[#3c8dbc]'}
                                    style={{ width: Math.min(100, completePercent) + '%' }}
                                />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs">
                                <span className="font-medium">{formatPercent(completePercent, 2) + '%'}</span>
                                <span className="text-gray-500 dark:text-gray-400">
                                    {formatVolume(Number(task.totalLength))}
                                    {task.files
                                        ? ` (${t('format.settings.file-count', { count: task.selectedFileCount })})`
                                        : ''}
                                </span>
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                                {isActive ? formatVolume(Number(task.downloadSpeed)) + '/s' : '-'}
                            </span>
                            <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                                {isActive ? formatVolume(Number(task.uploadSpeed)) + '/s' : '-'}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                                {showRemainTime ? formatDuration(Number(task.remainTime), 'HH:mm:ss') : ''}
                            </span>
                        </div>
                    </div>
                )}
            </SortableTaskRow>
        );
    };

    return (
        <section className="space-y-3">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                {taskListTabs.map((tab) => {
                    const Icon = tab.icon;

                    return (
                        <NavLink
                            key={tab.key}
                            to={'/' + tab.key}
                            className={
                                'flex items-center gap-1 rounded px-2 py-1 text-sm ' +
                                (location === tab.key
                                    ? 'bg-[#3c8dbc] text-white'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300')
                            }
                        >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {t(tab.label)}
                            <span className="rounded-full bg-black/10 px-1.5 text-[10px] dark:bg-white/15">
                                {taskCounts[tab.key] ?? 0}
                            </span>
                        </NavLink>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded bg-white px-3 py-2 shadow-sm dark:bg-gray-800">
                <span className="text-sm font-semibold">{t('Display Order')}</span>
                <select
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={orderType}
                    onChange={(event) => changeDisplayOrder(event.target.value)}
                >
                    <option value="default:asc">{t('Default')}</option>
                    <option value="name:asc">{t('By File Name')}</option>
                    <option value="size:asc">{t('By File Size')}</option>
                    <option value="percent:desc">{t('By Progress')}</option>
                    <option value="remain:asc">{t('By Remaining')}</option>
                    <option value="dspeed:desc">{t('By Download Speed')}</option>
                    <option value="uspeed:desc">{t('By Upload Speed')}</option>
                </select>

                <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => void copyDownloadUrls(selectedTasks.length > 0 ? selectedTasks : visibleTasks)}
                >
                    {t('Copy Download Url')}
                </button>

                {location === 'stopped' ? (
                    <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => void clearStoppedTasks()}
                    >
                        {t('Clear Stopped Tasks')}
                    </button>
                ) : null}

                <button
                    type="button"
                    className="ml-auto text-sm text-blue-600 hover:underline"
                    onClick={() => clearSelected()}
                >
                    {t('Select None')}
                </button>
            </div>

            {visibleTasks.length > 0 ? (
                isDraggable ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={(event) => void handleDragEnd(event)}
                    >
                        <SortableContext items={visibleTasks.map((task) => task.gid)} strategy={rectSortingStrategy}>
                            <div className={cardGridClass}>{visibleTasks.map(renderCard)}</div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div className={cardGridClass}>{visibleTasks.map(renderCard)}</div>
                )
            ) : (
                <div className="rounded bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
                    {t('There is no task')}
                </div>
            )}

            {contextMenu ? (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenuItems}
                    onClose={() => setContextMenu(null)}
                />
            ) : null}
        </section>
    );
}

interface SortableTaskRowProps {
    task: Aria2Task;
    isDraggable: boolean;
    children: (props: { handleProps: Record<string, unknown> }) => React.ReactNode;
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
