import { create } from 'zustand';
import { ariaNgConstants } from '@/config/constants';

export interface StatPoint {
    time: number;
    downloadSpeed: number;
    uploadSpeed: number;
}

export interface SpeedStat {
    downloadSpeed: number;
    uploadSpeed: number;
}

interface MonitorState {
    globalStats: StatPoint[];
    taskStats: Record<string, StatPoint[]>;
    recordGlobalStat: (stat: SpeedStat) => void;
    recordTaskStat: (gid: string, stat: SpeedStat) => void;
    clearTaskStats: (gid: string) => void;
}

function pushPoint(points: StatPoint[], stat: SpeedStat, capacity: number): StatPoint[] {
    const next = [...points, { time: Date.now(), downloadSpeed: stat.downloadSpeed, uploadSpeed: stat.uploadSpeed }];

    if (next.length > capacity) {
        next.splice(0, next.length - capacity);
    }

    return next;
}

export const useMonitorStore = create<MonitorState>((set) => ({
    globalStats: [],
    taskStats: {},
    recordGlobalStat: (stat) =>
        set((state) => ({
            globalStats: pushPoint(state.globalStats, stat, ariaNgConstants.globalStatStorageCapacity),
        })),
    recordTaskStat: (gid, stat) =>
        set((state) => ({
            taskStats: {
                ...state.taskStats,
                [gid]: pushPoint(state.taskStats[gid] || [], stat, ariaNgConstants.taskStatStorageCapacity),
            },
        })),
    clearTaskStats: (gid) =>
        set((state) => {
            const next = { ...state.taskStats };
            delete next[gid];
            return { taskStats: next };
        }),
}));
