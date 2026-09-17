import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    const options = useSettingStore((state) => state.options);
    const setOption = useSettingStore((state) => state.setOption);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

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
        orderType
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

                await aria2TaskService.changeTaskPosition(String(active.id), newIndex, () => {
                    setPollingPaused(false);
                }, true);

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
                onClick: () => targets.filter((item) => isTaskRetryable(item)).forEach((item) => void retryTask(item))
            },
            { label: t('Start'), disabled: !hasResumable, onClick: () => void aria2TaskService.startTasks(targets.map((item) => item.gid)) },
            { label: t('Pause'), disabled: !hasPausable, onClick: () => void aria2TaskService.pauseTasks(targets.map((item) => item.gid)) },
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
                onClick: () => void copyDownloadUrls(targets)
            },
            {
                label: t('Copy Magnet Link'),
                disabled: !targets.some((item) => item.infoHash),
                onClick: () => void copyMagnetLinks(targets)
            }
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextMenu, selected, selectedTasks, t]);

    const renderRow = (task: Aria2Task) => {
        const completePercent = Number(task.completePercent || 0);
        const statusText = t(getTaskStatusKey(task, true), {
            errorcode: task.errorCode,
            verifiedPercent: task.verifiedPercent
        });
        const isActive = task.status === 'active';

        return (
            <SortableTaskRow key={task.gid} task={task} isDraggable={isDraggable}>
                {({ handleProps }) => (
                    <div
                        className="grid cursor-pointer grid-cols-12 items-center gap-2 border-b border-gray-200 px-2 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        onClick={() => toggleSelected(task.gid)}
                        onContextMenu={(event) => {
                            event.preventDefault();
                            setContextMenu({ x: event.clientX, y: event.clientY, task });
                        }}
                    >
                        <div className="col-span-5 flex min-w-0 items-center gap-2">
                            {isDraggable ? (
                                <span
                                    className="cursor-grab select-none text-gray-400"
                                    title={t('Change Tasks Order by Drag-and-drop')}
                                    {...handleProps}
                                >
                                    &#8942;&#8942;
                                </span>
                            ) : null}
                            <input
                                type="checkbox"
                                checked={!!selected[task.gid]}
                                onClick={(event) => event.stopPropagation()}
                                onChange={() => toggleSelected(task.gid)}
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={'/task/detail/' + task.gid}
                                        className="truncate text-blue-600 hover:underline"
                                        title={task.taskName}
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        {task.taskName}
                                    </Link>
                                    {task.status === 'error' && task.errorDescription ? (
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
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatVolume(Number(task.totalLength))}
                                    {task.files ? ` (${t('format.settings.file-count', { count: task.selectedFileCount })})` : ''}
                                </div>
                            </div>
                        </div>

                        <div className="col-span-3">
                            <div className="h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                                <div
                                    className={task.status === 'error' ? 'h-full bg-amber-500' : 'h-full bg-[#3c8dbc]'}
                                    style={{ width: Math.min(100, completePercent) + '%' }}
                                />
                            </div>
                            <div className="mt-0.5 flex justify-between text-xs">
                                <span>{formatPercent(completePercent, 2) + '%'}</span>
                                <span className="text-gray-500">
                                    {isActive && task.remainTime !== undefined && task.remainTime >= 0 && task.remainTime < 86400
                                        ? formatDuration(Number(task.remainTime), 'HH:mm:ss')
                                        : ''}
                                </span>
                            </div>
                        </div>

                        <div className="col-span-2 text-xs">{statusText}</div>
                        <div className="col-span-1 text-right text-xs">
                            {isActive ? formatVolume(Number(task.downloadSpeed)) + '/s' : ''}
                        </div>
                        <div className="col-span-1 text-right text-xs">
                            {isActive ? formatVolume(Number(task.uploadSpeed)) + '/s' : ''}
                        </div>
                    </div>
                )}
            </SortableTaskRow>
        );
    };

    return (
        <section className="rounded bg-white shadow dark:bg-gray-800">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
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
                    <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => void clearStoppedTasks()}>
                        {t('Clear Stopped Tasks')}
                    </button>
                ) : null}

                <button type="button" className="ml-auto text-sm text-blue-600 hover:underline" onClick={() => clearSelected()}>
                    {t('Select None')}
                </button>
            </div>

            {visibleTasks.length > 0 ? (
                isDraggable ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(event) => void handleDragEnd(event)}>
                        <SortableContext items={visibleTasks.map((task) => task.gid)} strategy={verticalListSortingStrategy}>
                            <div>{visibleTasks.map(renderRow)}</div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div>{visibleTasks.map(renderRow)}</div>
                )
            ) : (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">{t('There is no task')}</div>
            )}

            <div className="p-2 text-center">
                <Link to="/new" className="text-sm text-blue-600 hover:underline">
                    {t('New')}
                </Link>
            </div>

            {contextMenu ? (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenuItems} onClose={() => setContextMenu(null)} />
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
        disabled: !isDraggable
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children({ handleProps: { ...attributes, ...listeners } })}
        </div>
    );
}
