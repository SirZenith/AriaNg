import {
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
import BottomBar from '@/components/BottomBar';
import PieceBar from '@/components/PieceBar';
import PieceMap from '@/components/PieceMap';
import TaskDetailToolbar from '@/components/TaskDetailToolbar';
import TopBar from '@/components/TopBar';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import {
    getAfterRetryingTask,
    getConfirmTaskRemoval,
    getShowPiecesInfoInTaskDetailPage,
} from '@/services/settingService';
import { aria2TaskService } from '@/services/taskService';
import type { Aria2Task } from '@/types/aria2';
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

function TaskDetailPanel({ children }: { children: ReactNode }) {
    return (
        <div className="space-y-3">
            <TopBar>
                <TaskDetailToolbar />
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

    const healthPercent = useMemo(() => {
        if (!task) {
            return 0;
        }

        if (peers.length > 0) {
            return estimateHealthPercentFromPeers(task, peers);
        }

        return Number(task.completePercent || 0);
    }, [task, peers]);

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

    const showTrackers = !!task.bittorrent?.announceList?.length;

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

    const tabs: { key: string; label: string; icon: LucideIcon }[] = [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard },
        ...(showPiecesInfo ? [{ key: 'pieces', label: 'Pieces', icon: LayoutGrid }] : []),
        { key: 'filelist', label: 'Files', icon: FileText },
        ...(showPeers ? [{ key: 'btpeers', label: 'Peers', icon: Users }] : []),
        ...(showTrackers ? [{ key: 'trackers', label: 'Tracker', icon: Radio }] : []),
        ...(showSettings ? [{ key: 'settings', label: 'Settings', icon: Settings }] : []),
    ];

    return (
        <TaskDetailPanel>
            <section className="rounded bg-white p-4 shadow dark:bg-gray-800">
                <div className="mb-3 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
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

            <BottomBar>
                <div className="bottom-bar mx-auto mb-2 flex items-center justify-center w-[90%] max-w-250 gap-2 px-4 py-3 rounded-full">
                    {task.status === 'active' ? (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => void changeTaskState('pause')}
                        >
                            <Pause className="h-4 w-4" aria-hidden="true" />
                            <span>{t('Pause')}</span>
                        </button>
                    ) : null}

                    {task.status === 'waiting' || task.status === 'paused' ? (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => void changeTaskState('start')}
                        >
                            <Play className="h-4 w-4" aria-hidden="true" />
                            <span>{t('Start')}</span>
                        </button>
                    ) : null}

                    {isTaskRetryable(task) ? (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void retryTask(task)}>
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            <span>{t('Retry')}</span>
                        </button>
                    ) : null}

                    <button
                        type="button"
                        className="btn btn-danger btn-sm ml-auto"
                        onClick={() => void removeTask(task)}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>{t('Delete')}</span>
                    </button>
                </div>
            </BottomBar>
        </TaskDetailPanel>
    );
}
