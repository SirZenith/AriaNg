import {
    Copy,
    FileText,
    LayoutDashboard,
    LayoutGrid,
    Pause,
    Play,
    Radio,
    RotateCcw,
    Settings,
    Trash2,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import PieceBar from '@/components/PieceBar';
import PieceMap from '@/components/PieceMap';
import SplitBottomBar from '@/components/SplitBottomBar';
import TaskDetailToolbar from '@/components/TaskDetailToolbar';
import TopBar from '@/components/TopBar';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import {
    getAfterRetryingTask,
    getConfirmTaskRemoval,
    getShowPiecesInfoInTaskDetailPage,
} from '@/services/settingService';
import { notifyInPage } from '@/services/notification';
import { aria2TaskService } from '@/services/taskService';
import type { Aria2Task } from '@/types/aria2';
import { copyText } from '@/utils/clipboard';
import { estimateHealthPercentFromPeers, isTaskRetryable } from '@/utils/task';
import TaskFileList from './TaskFileList';
import TaskOptionSettings from './TaskOptionSettings';
import TaskOverview from './TaskOverview';
import TaskPeerList from './TaskPeerList';
import TaskTrackerList from './TaskTrackerList';

function isShowPiecesInfo(task: Aria2Task | null): boolean {
    const setting = getShowPiecesInfoInTaskDetailPage();

    if (!task || setting === 'never') {
        return false;
    }

    const numPieces = Number(task.numPieces || 0);

    if (setting === 'le102400') {
        return numPieces <= 102400;
    } else if (setting === 'le10240') {
        return numPieces <= 10240;
    } else if (setting === 'le1024') {
        return numPieces <= 1024;
    }

    return true;
}

function TaskDetailPanel({ children, tabs }: { children: ReactNode; tabs?: ReactNode }) {
    return (
        <div className="space-y-3">
            <TopBar>
                <TaskDetailToolbar />
                {tabs}
            </TopBar>
            {children}
        </div>
    );
}

export default function TaskDetailPage() {
    const { t } = useTranslation();
    const { gid } = useParams();
    const navigate = useNavigate();
    const { task, peers, loading } = useTaskDetail(gid);
    const [currentTab, setCurrentTab] = useState('overview');
    const [refreshKey, setRefreshKey] = useState(0);

    const showPiecesInfo = useMemo(() => isShowPiecesInfo(task), [task]);
    const showPeers = !!task && !!task.bittorrent && task.status === 'active';
    const showSettings = !!task && (task.status === 'active' || task.status === 'waiting' || task.status === 'paused');
    const showTrackers = !!task?.bittorrent?.announceList?.length;

    const healthPercent = useMemo(() => {
        if (!task) {
            return 0;
        }

        if (peers.length > 0) {
            return estimateHealthPercentFromPeers(task, peers);
        }

        return Number(task.completePercent || 0);
    }, [task, peers]);

    const tabs: { key: string; label: string; icon: LucideIcon }[] = [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard },
        ...(showPiecesInfo ? [{ key: 'pieces', label: 'Pieces', icon: LayoutGrid }] : []),
        { key: 'filelist', label: 'Files', icon: FileText },
        ...(showPeers ? [{ key: 'btpeers', label: 'Peers', icon: Users }] : []),
        ...(showTrackers ? [{ key: 'trackers', label: 'Tracker', icon: Radio }] : []),
        ...(showSettings ? [{ key: 'settings', label: 'Settings', icon: Settings }] : []),
    ];

    const tabList = (
        <div className="mx-auto mt-1 flex w-full max-w-[1000px] flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((item) => {
                const Icon = item.icon;

                return (
                    <button
                        key={item.key}
                        type="button"
                        className={
                            'flex items-center gap-1 px-3 py-2 text-sm ' +
                            (currentTab === item.key
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')
                        }
                        onClick={() => setCurrentTab(item.key)}
                    >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t(item.label)}</span>
                    </button>
                );
            })}
        </div>
    );

    if (loading && !task) {
        return (
            <TaskDetailPanel>
                <div className="p-6 text-sm text-gray-500">{t('Loading')}</div>
            </TaskDetailPanel>
        );
    }

    if (!task) {
        return (
            <TaskDetailPanel>
                <div className="p-6 text-sm text-gray-500">{t('There is no task')}</div>
            </TaskDetailPanel>
        );
    }

    const changeTaskState = async (state: 'start' | 'pause') => {
        if (state === 'start') {
            await aria2TaskService.startTasks([task.gid]);
        } else {
            await aria2TaskService.pauseTasks([task.gid]);
        }
    };

    const retryTask = async (target: Aria2Task) => {
        const response = await aria2TaskService.retryTask(target.gid);
        const afterRetrying = getAfterRetryingTask();

        if (afterRetrying === 'task-detail' && response.success && typeof response.data === 'string') {
            navigate('/task/detail/' + response.data);
        } else if (afterRetrying === 'task-list-downloading') {
            navigate('/tasks/downloading');
        }
    };

    const removeTask = async (target: Aria2Task) => {
        if (getConfirmTaskRemoval() && !window.confirm(t('Are you sure you want to remove the selected tasks?'))) {
            return;
        }

        await aria2TaskService.removeTasks([target]);
        navigate('/tasks/downloading');
    };

    const copyTaskLink = async () => {
        const url = task.singleUrl;

        if (!url) {
            notifyInPage('Error', t('There is no url in selected tasks'), { type: 'error' });
            return;
        }

        if (await copyText(url)) {
            notifyInPage('', t('Data has been copied to clipboard.'), { type: 'success' });
        }
    };

    return (
        <TaskDetailPanel tabs={tabList}>
            <section className="rounded bg-white p-4 shadow dark:bg-gray-800">
                {currentTab === 'overview' ? (
                    <TaskOverview task={task} healthPercent={healthPercent} showPiecesInfo={showPiecesInfo} />
                ) : null}

                {currentTab === 'pieces' && showPiecesInfo ? (
                    <div>
                        <PieceBar bitField={task.bitfield} pieceCount={Number(task.numPieces || 0)} />
                        <div className="mt-4">
                            <PieceMap bitField={task.bitfield} pieceCount={Number(task.numPieces || 0)} />
                        </div>
                    </div>
                ) : null}

                {currentTab === 'filelist' ? (
                    <TaskFileList key={refreshKey} task={task} onChanged={() => setRefreshKey((value) => value + 1)} />
                ) : null}

                {currentTab === 'btpeers' ? (
                    <TaskPeerList peers={peers} pieceCount={Number(task.numPieces || 0)} />
                ) : null}

                {currentTab === 'trackers' && showTrackers ? <TaskTrackerList task={task} /> : null}

                {currentTab === 'settings' ? <TaskOptionSettings task={task} /> : null}
            </section>

            <SplitBottomBar
                leading={
                    <>
                        {task.status === 'active' ? (
                            <button
                                type="button"
                                className="bottom-bar-item"
                                title={t('Pause')}
                                aria-label={t('Pause')}
                                onClick={() => void changeTaskState('pause')}
                            >
                                <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                                <span className="hidden md:inline">{t('Pause')}</span>
                            </button>
                        ) : null}

                        {task.status === 'waiting' || task.status === 'paused' ? (
                            <button
                                type="button"
                                className="bottom-bar-item bottom-bar-item-active"
                                title={t('Start')}
                                aria-label={t('Start')}
                                onClick={() => void changeTaskState('start')}
                            >
                                <Play className="h-4 w-4 text-green-600 dark:text-green-500" aria-hidden="true" />
                                <span className="hidden md:inline">{t('Start')}</span>
                            </button>
                        ) : null}

                        {isTaskRetryable(task) ? (
                            <button
                                type="button"
                                className="bottom-bar-item"
                                title={t('Retry')}
                                aria-label={t('Retry')}
                                onClick={() => void retryTask(task)}
                            >
                                <RotateCcw
                                    className="h-4 w-4 text-primary dark:text-primary-light"
                                    aria-hidden="true"
                                />
                                <span className="hidden md:inline">{t('Retry')}</span>
                            </button>
                        ) : null}

                        <button
                            type="button"
                            className="bottom-bar-item"
                            title={t('Copy Download Url')}
                            aria-label={t('Copy Download Url')}
                            onClick={() => void copyTaskLink()}
                        >
                            <Copy className="h-4 w-4 text-primary dark:text-primary-light" aria-hidden="true" />
                            <span className="hidden md:inline">{t('Copy Download Url')}</span>
                        </button>
                    </>
                }
                trailing={
                    <button
                        type="button"
                        className="bottom-bar-item text-red-600 dark:text-red-400"
                        title={t('Delete')}
                        aria-label={t('Delete')}
                        onClick={() => void removeTask(task)}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Delete')}</span>
                    </button>
                }
            />
        </TaskDetailPanel>
    );
}
