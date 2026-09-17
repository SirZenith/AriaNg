import { useTranslation } from 'react-i18next';
import PieceBar from '@/components/PieceBar';
import SpeedChart from '@/components/SpeedChart';
import { useMonitorStore } from '@/services/monitor';
import type { Aria2Task } from '@/types/aria2';
import { formatDuration, formatLongDate, formatPercent, formatVolume } from '@/utils/format';
import { getTaskStatusKey } from '@/utils/task';

interface TaskOverviewProps {
    task: Aria2Task;
    healthPercent: number;
    showPiecesInfo: boolean;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2 last:border-0 sm:grid-cols-3 dark:border-gray-700">
            <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="break-all text-sm sm:col-span-2">{children}</dd>
        </div>
    );
}

export default function TaskOverview({ task, healthPercent, showPiecesInfo }: TaskOverviewProps) {
    const { t } = useTranslation();
    const stats = useMonitorStore((state) => state.taskStats[task.gid] || []);
    const numPieces = Number(task.numPieces || 0);
    const isActive = task.status === 'active';

    return (
        <div>
            <dl className="rounded border border-gray-200 px-3 dark:border-gray-700">
                <Row label={t('Task Name')}>{task.taskName}</Row>
                <Row label={t('Status')}>{t(getTaskStatusKey(task), { errorcode: task.errorCode, verifiedPercent: task.verifiedPercent })}</Row>
                {task.errorDescription ? (
                    <Row label={t('Error')}>
                        <span className="text-red-600">
                            {t(task.errorDescription)}
                            {task.errorCode ? ` (${task.errorCode})` : ''}
                        </span>
                    </Row>
                ) : null}
                <Row label={t('File Size')}>{formatVolume(Number(task.totalLength))}</Row>
                <Row label={t('Completed Length')}>
                    {formatVolume(Number(task.completedLength))} ({formatPercent(Number(task.completePercent || 0), 2)}%)
                </Row>
                {task.uploadLength ? <Row label={t('Upload Length')}>{formatVolume(Number(task.uploadLength))}</Row> : null}
                {task.shareRatio !== undefined ? <Row label={t('Share Ratio')}>{Number(task.shareRatio).toFixed(3)}</Row> : null}
                <Row label={t('Download Speed')}>{isActive ? formatVolume(Number(task.downloadSpeed)) + '/s' : '-'}</Row>
                <Row label={t('Upload Speed')}>{isActive ? formatVolume(Number(task.uploadSpeed)) + '/s' : '-'}</Row>
                {isActive ? (
                    <Row label={t('Remaining')}>
                        {Number(task.remainTime) >= 0 && Number(task.remainTime) < 86400
                            ? formatDuration(Number(task.remainTime), 'HH:mm:ss')
                            : t('More Than One Day')}
                    </Row>
                ) : null}
                <Row label={t('Connections')}>
                    {task.connections}
                    {task.numSeeders ? ` (${t('Seeders')}: ${task.numSeeders})` : ''}
                </Row>
                {numPieces > 0 ? (
                    <Row label={t('Pieces')}>
                        {t('format.task.pieceinfo', { completed: task.completedPieces, total: numPieces })}
                    </Row>
                ) : null}
                {task.bittorrent ? <Row label={t('Health')}>{formatPercent(healthPercent, 2) + '%'}</Row> : null}
                {task.bittorrent?.info?.name ? <Row label={t('BitTorrent Name')}>{task.bittorrent.info.name}</Row> : null}
                {task.bittorrent?.comment ? <Row label={t('Comment')}>{task.bittorrent.comment}</Row> : null}
                {task.bittorrent?.creationDate ? (
                    <Row label={t('Creation Date')}>
                        {formatLongDate(task.bittorrent.creationDate * 1000, t('format.longdate'))}
                    </Row>
                ) : null}
                {task.bittorrent?.mode ? <Row label={t('BitTorrent Mode')}>{task.bittorrent.mode}</Row> : null}
                {task.infoHash ? <Row label={t('Info Hash')}>{task.infoHash}</Row> : null}
                {task.singleUrl ? <Row label={t('Download Url')}>{task.singleUrl}</Row> : null}
                {task.bittorrent?.announceList && task.bittorrent.announceList.length > 0 ? (
                    <Row label={t('Tracker')}>
                        <span className="block max-h-32 overflow-y-auto">
                            {task.bittorrent.announceList.map((trackers, index) => (
                                <span key={index} className="block truncate">
                                    {trackers.join(' | ')}
                                </span>
                            ))}
                        </span>
                    </Row>
                ) : null}
            </dl>

            {showPiecesInfo && numPieces > 0 ? (
                <div className="mt-4">
                    <PieceBar bitField={task.bitfield} pieceCount={numPieces} />
                </div>
            ) : null}

            {stats.length > 1 ? (
                <div className="mt-4 rounded border border-gray-200 p-2 dark:border-gray-700">
                    <SpeedChart data={stats} />
                </div>
            ) : null}
        </div>
    );
}
