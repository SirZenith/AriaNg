import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { CheckCircle2, Clock, Download, BrushCleaning, type LucideIcon } from 'lucide-react';
import ContextMenu, { type ContextMenuItem } from '@/components/ContextMenu';
import TaskListToolbar from '@/components/TaskListToolbar';
import TopBar from '@/components/TopBar';
import TopBarTabs from '@/components/TopBarTabs';
import { useTaskListPolling } from '@/hooks/useAria2';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { aria2TaskService } from '@/services/taskService';
import { notifyInPage } from '@/services/notification';
import { getAfterRetryingTask, getConfirmTaskRemoval, getDragAndDropTasks } from '@/services/settingService';
import { useSettingStore } from '@/stores/settingStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Aria2Task } from '@/types/aria2';
import { copyText } from '@/utils/clipboard';
import { filterTask, isTaskRetryable, orderTasks } from '@/utils/task';
import TaskCard from './TaskCard';
import ReturnToolbar from '@/components/ReturnToolbar';

interface ContextMenuState {
    x: number;
    y: number;
    task: Aria2Task;
}

const cardGridClass = 'grid grid-cols-1 gap-3';

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
    useScrollRestoration(location);

    const { t } = useTranslation();
    const navigate = useNavigate();
    const tasks = useTaskStore((state) => state.tasks);
    const selected = useTaskStore((state) => state.selected);
    const searchKeyword = useTaskStore((state) => state.searchKeyword);
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
            navigate('/tasks/downloading');
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

    const taskCards = visibleTasks.map((task) => (
        <TaskCard
            key={task.gid}
            task={task}
            isDraggable={isDraggable}
            onRetry={(task) => void retryTask(task)}
            onContextMenu={(event, task) => setContextMenu({ x: event.clientX, y: event.clientY, task })}
        />
    ));

    return (
        <>
            <TopBar>
                <ReturnToolbar title={t('Tasks')} to="/home"></ReturnToolbar>

                <TopBarTabs
                    tabs={taskListTabs.map((tab) => ({
                        key: tab.key,
                        label: t(tab.label),
                        icon: tab.icon,
                        count: taskCounts[tab.key] ?? 0,
                        to: '/tasks/' + tab.key,
                    }))}
                    activeKey={location}
                    hideLabelsOnMobile
                />

                <div className="panel mt-2 flex w-full mx-auto max-w-250 flex-wrap items-center gap-2 px-3 py-2">
                    <span className="text-sm font-semibold">{t('Display Order')}</span>
                    <select
                        className="input w-auto"
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

                    {location === 'stopped' ? (
                        <button
                            type="button"
                            className="ml-auto btn btn-danger-soft btn-sm"
                            onClick={() => void clearStoppedTasks()}
                        >
                            <span className="hidden md:inline">{t('Clear Stopped Tasks')}</span>
                            <BrushCleaning className="inline md:hidden h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </TopBar>

            <section className="space-y-3">
                {visibleTasks.length > 0 ? (
                    isDraggable ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={(event) => void handleDragEnd(event)}
                        >
                            <SortableContext
                                items={visibleTasks.map((task) => task.gid)}
                                strategy={rectSortingStrategy}
                            >
                                <div className={cardGridClass}>{taskCards}</div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className={cardGridClass}>{taskCards}</div>
                    )
                ) : (
                    <div className="panel p-8 text-center text-sm text-gray-500 dark:text-gray-400">
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

            <TaskListToolbar />
        </>
    );
}
