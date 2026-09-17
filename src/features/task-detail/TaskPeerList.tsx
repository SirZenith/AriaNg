import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Aria2Peer } from '@/types/aria2';
import { formatPercent, formatVolume } from '@/utils/format';
import { orderPeers } from '@/utils/task';

interface TaskPeerListProps {
    peers: Aria2Peer[];
}

export default function TaskPeerList({ peers }: TaskPeerListProps) {
    const { t } = useTranslation();
    const [orderType, setOrderType] = useState('default:asc');
    const orderedPeers = useMemo(() => orderPeers(peers, orderType), [peers, orderType]);

    if (peers.length < 1) {
        return <div className="p-4 text-center text-sm text-gray-500">{t('There is no peer')}</div>;
    }

    return (
        <div>
            <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold">{t('Peers')}</span>
                <select
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={orderType}
                    onChange={(event) => setOrderType(event.target.value)}
                >
                    <option value="default:asc">{t('Default')}</option>
                    <option value="name:asc">{t('By Address')}</option>
                    <option value="percent:desc">{t('By Progress')}</option>
                    <option value="dspeed:desc">{t('By Download Speed')}</option>
                    <option value="uspeed:desc">{t('By Upload Speed')}</option>
                </select>
            </div>

            <div className="rounded border border-gray-200 dark:border-gray-700">
                <div className="hidden grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold sm:grid dark:border-gray-700 dark:bg-gray-900">
                    <div className="col-span-3">{t('Address')}</div>
                    <div className="col-span-3">{t('Client')}</div>
                    <div className="col-span-2">{t('Progress')}</div>
                    <div className="col-span-2 text-right">{t('Download Speed')}</div>
                    <div className="col-span-2 text-right">{t('Upload Speed')}</div>
                </div>

                {orderedPeers.map((peer, index) => (
                    <div
                        key={(peer.peerId || peer.name || 'peer') + index}
                        className="grid grid-cols-12 items-center gap-2 border-b border-gray-100 px-2 py-1.5 text-sm last:border-0 dark:border-gray-700"
                    >
                        <div className="col-span-12 flex items-center gap-1 sm:col-span-3">
                            <span className="truncate" title={peer.name}>
                                {peer.name}
                            </span>
                            {peer.seeder === true || peer.seeder === 'true' ? (
                                <span className="text-green-600" title={t('Seeding')}>
                                    &#8679;
                                </span>
                            ) : null}
                        </div>
                        <div className="col-span-6 truncate text-xs sm:col-span-3" title={peer.peerId}>
                            {peer.client?.info || peer.peerId || '-'}
                        </div>
                        <div className="col-span-3 text-xs sm:col-span-2">
                            {formatPercent(Number(peer.completePercent || 0), 2) + '%'}
                        </div>
                        <div className="col-span-3 text-right text-xs sm:col-span-2">
                            {formatVolume(Number(peer.downloadSpeed)) + '/s'}
                        </div>
                        <div className="col-span-3 text-right text-xs sm:col-span-2">
                            {formatVolume(Number(peer.uploadSpeed)) + '/s'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
