import type { Aria2Task } from '@/types/aria2';

export default function TaskTrackerList({ task }: { task: Aria2Task }) {
    const tiers = task.bittorrent?.announceList || [];

    return (
        <div className="flex flex-col gap-2">
            {tiers.map((trackers, tierIndex) => (
                <div key={tierIndex} className="rounded border border-gray-200 dark:border-gray-700">
                    {trackers.map((tracker, index) => (
                        <div
                            key={index}
                            className="border-b border-gray-100 px-2 py-1.5 font-mono text-xs break-all last:border-0 dark:border-gray-700"
                        >
                            {tracker}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
