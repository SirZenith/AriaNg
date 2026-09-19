import { ArrowDown, ArrowUp, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PieceBar from '@/components/PieceBar';
import { notifyInPage } from '@/services/notification';
import type { Aria2Peer } from '@/types/aria2';
import { copyText } from '@/utils/clipboard';
import { formatPercent, formatVolume } from '@/utils/format';
import { toDisplayablePeerId } from '@/utils/peerId';
import { orderPeers } from '@/utils/task';

interface TaskPeerListProps {
    peers: Aria2Peer[];
    pieceCount: number;
}

const ipMaxLength = 25;

function middleEllipsis(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    }

    const head = Math.ceil((maxLength - 1) / 2);
    const tail = Math.floor((maxLength - 1) / 2);

    return value.slice(0, head) + '…' + value.slice(value.length - tail);
}

export default function TaskPeerList({ peers, pieceCount }: TaskPeerListProps) {
    const { t } = useTranslation();
    const [orderType, setOrderType] = useState('default:asc');
    const orderedPeers = useMemo(() => orderPeers(peers, orderType), [peers, orderType]);

    const copyPeerIp = async (ip: string) => {
        if (await copyText(ip)) {
            notifyInPage('', t('Data has been copied to clipboard.'), { type: 'success' });
        }
    };

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

            <div className="flex flex-col gap-2">
                {orderedPeers.map((peer, index) => {
                    const displayIp = peer.ip || peer.name || '-';
                    const displayClient = peer.client?.info || (peer.peerId ? toDisplayablePeerId(peer.peerId) : '-');

                    return (
                        <div
                            key={(peer.peerId || peer.name || 'peer') + index}
                            className="flex flex-col gap-2 rounded border border-gray-200 p-2 text-sm dark:border-gray-700"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="min-w-0 truncate font-mono text-xs" title={peer.ip}>
                                    {middleEllipsis(displayIp, ipMaxLength)}
                                </span>
                                {peer.ip ? (
                                    <button
                                        type="button"
                                        className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                        title={t('Copy')}
                                        aria-label={t('Copy')}
                                        onClick={() => void copyPeerIp(peer.ip)}
                                    >
                                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex min-w-0 items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <span className="min-w-0 truncate" title={displayClient}>
                                    {displayClient}
                                </span>
                                {peer.seeder ? (
                                    <span className="shrink-0 text-green-600" title={t('Seeding')}>
                                        &#8679;
                                    </span>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1">
                                    <PieceBar bitField={peer.bitfield} pieceCount={pieceCount} color="#88c0d0" />
                                </div>
                                <span className="shrink-0 text-xs">
                                    {formatPercent(Number(peer.completePercent || 0), 2) + '%'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                                    {formatVolume(Number(peer.downloadSpeed)) + '/s'}
                                </span>
                                <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                                    {formatVolume(Number(peer.uploadSpeed)) + '/s'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
