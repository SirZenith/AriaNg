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
import BottomBarButton from '@/components/BottomBarButton';
import PieceBar from '@/components/PieceBar';
import PieceMap from '@/components/PieceMap';
import SplitBottomBar from '@/components/SplitBottomBar';
import TaskDetailToolbar from '@/components/TaskDetailToolbar';
import TopBar from '@/components/TopBar';
import TopBarTabs from '@/components/TopBarTabs';
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
        <TopBarTabs
            tabs={tabs.map((item) => ({
                key: item.key,
                label: t(item.label),
                icon: item.icon,
                onClick: () => setCurrentTab(item.key),
            }))}
            activeKey={currentTab}
            hideLabelsOnMobile
        />
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
                            <BottomBarButton
                                ariaLabel={t('Pause')}
                                label={t('Pause')}
                                icon={Pause}
                                iconClassName="text-amber-600 dark:text-amber-400"
                                onClick={() => void changeTaskState('pause')}
                            />
                        ) : null}

                        {task.status === 'waiting' || task.status === 'paused' ? (
                            <BottomBarButton
                                ariaLabel={t('Start')}
                                label={t('Start')}
                                icon={Play}
                                iconClassName="text-green-600 dark:text-green-500"
                                className="bottom-bar-item-active"
                                onClick={() => void changeTaskState('start')}
                            />
                        ) : null}

                        {isTaskRetryable(task) ? (
                            <BottomBarButton
                                ariaLabel={t('Retry')}
                                label={t('Retry')}
                                icon={RotateCcw}
                                iconClassName="text-primary dark:text-primary-light"
                                onClick={() => void retryTask(task)}
                            />
                        ) : null}

                        <BottomBarButton
                            ariaLabel={t('Copy Download Url')}
                            label={t('Copy Download Url')}
                            icon={Copy}
                            iconClassName="text-primary dark:text-primary-light"
                            onClick={() => void copyTaskLink()}
                        />
                    </>
                }
                trailing={
                    <BottomBarButton
                        ariaLabel={t('Delete')}
                        label={t('Delete')}
                        icon={Trash2}
                        className="text-red-600 dark:text-red-400"
                        onClick={() => void removeTask(task)}
                    />
                }
            />
        </TaskDetailPanel>
    );
}
