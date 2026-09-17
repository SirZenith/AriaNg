import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import PieceBar from '@/components/PieceBar';
import PieceMap from '@/components/PieceMap';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { getShowPiecesInfoInTaskDetailPage } from '@/services/settingService';
import type { Aria2Task } from '@/types/aria2';
import { estimateHealthPercentFromPeers } from '@/utils/task';
import TaskFileList from './TaskFileList';
import TaskOptionSettings from './TaskOptionSettings';
import TaskOverview from './TaskOverview';
import TaskPeerList from './TaskPeerList';

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

export default function TaskDetailPage() {
    const { t } = useTranslation();
    const { gid } = useParams();
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
        return <div className="p-6 text-sm text-gray-500">{t('Loading')}</div>;
    }

    if (!task) {
        return <div className="p-6 text-sm text-gray-500">{t('There is no task')}</div>;
    }

    const tabs = [
        { key: 'overview', label: 'Overview' },
        ...(showPiecesInfo ? [{ key: 'pieces', label: 'Pieces' }] : []),
        { key: 'filelist', label: 'Files' },
        ...(showPeers ? [{ key: 'btpeers', label: 'Peers' }] : []),
        ...(showSettings ? [{ key: 'settings', label: 'Settings' }] : [])
    ];

    return (
        <section className="rounded bg-white p-4 shadow dark:bg-gray-800">
            <div className="mb-3 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
                {tabs.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={
                            'px-3 py-2 text-sm ' +
                            (currentTab === item.key
                                ? 'border-b-2 border-[#3c8dbc] text-[#3c8dbc]'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')
                        }
                        onClick={() => setCurrentTab(item.key)}
                    >
                        {t(item.label)}
                    </button>
                ))}
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

            {currentTab === 'btpeers' ? <TaskPeerList peers={peers} /> : null}

            {currentTab === 'settings' ? <TaskOptionSettings task={task} /> : null}
        </section>
    );
}
