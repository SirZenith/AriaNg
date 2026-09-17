import { useEffect, useState } from 'react';
import { useMonitorStore } from '@/services/monitor';
import { getDownloadTaskRefreshInterval } from '@/services/settingService';
import { aria2TaskService } from '@/services/taskService';
import type { Aria2Peer, Aria2Task, TaskResponse } from '@/types/aria2';

interface TaskDetailResult {
    task: Aria2Task | null;
    peers: Aria2Peer[];
    loading: boolean;
}

function isPeerRequired(task: Aria2Task): boolean {
    return !!task.bittorrent && task.status === 'active';
}

export function useTaskDetail(gid: string | undefined): TaskDetailResult {
    const [task, setTask] = useState<Aria2Task | null>(null);
    const [peers, setPeers] = useState<Aria2Peer[]>([]);
    const [loading, setLoading] = useState(true);
    const recordTaskStat = useMonitorStore((state) => state.recordTaskStat);

    useEffect(() => {
        if (!gid) {
            return undefined;
        }

        let cancelled = false;
        let latestTask: Aria2Task | null = null;

        const applyTask = (nextTask: Aria2Task) => {
            latestTask = nextTask;
            setTask(nextTask);
            recordTaskStat(gid, {
                downloadSpeed: Number(nextTask.downloadSpeed || 0),
                uploadSpeed: Number(nextTask.uploadSpeed || 0)
            });
        };

        const refresh = async (silent: boolean) => {
            if (!latestTask) {
                const response: TaskResponse = await aria2TaskService.getTaskStatus(gid, undefined, silent, true);

                if (cancelled) {
                    return;
                }

                setLoading(false);

                if (!response.success || !response.data) {
                    return;
                }

                const nextTask = response.data as Aria2Task;
                applyTask(nextTask);

                if (isPeerRequired(nextTask)) {
                    const peerResponse = await aria2TaskService.getBtTaskPeers(nextTask, undefined, silent, true);

                    if (!cancelled && peerResponse.success && Array.isArray(peerResponse.data)) {
                        setPeers(peerResponse.data as Aria2Peer[]);
                    }
                }

                return;
            }

            const response = await aria2TaskService.getTaskStatusAndBtPeers(
                gid,
                undefined,
                silent,
                isPeerRequired(latestTask),
                true,
                true
            );

            if (cancelled) {
                return;
            }

            if (response.task) {
                applyTask(response.task);
            }

            if (response.peers) {
                setPeers(response.peers);
            }
        };

        void refresh(false);

        const interval = getDownloadTaskRefreshInterval();
        const timer = interval > 0 ? window.setInterval(() => void refresh(true), interval) : null;

        return () => {
            cancelled = true;

            if (timer !== null) {
                window.clearInterval(timer);
            }
        };
    }, [gid, recordTaskStat]);

    return { task, peers, loading };
}
