import { create } from 'zustand';
import type { Aria2Task } from '@/types/aria2';
import { filterTask } from '@/utils/task';

export type RpcStatus = 'Connecting' | 'Connected' | 'Disconnected' | 'Reconnecting' | 'Waiting to reconnect';

export interface GlobalStatData {
    downloadSpeed: number;
    uploadSpeed: number;
    numActive: number;
    numWaiting: number;
    numStopped: number;
}

interface TaskState {
    rpcStatus: RpcStatus;
    tasks: Aria2Task[];
    selected: Record<string, boolean>;
    enableSelectAll: boolean;
    searchKeyword: string;
    globalStat: GlobalStatData;
    pollingPaused: boolean;
    setPollingPaused: (value: boolean) => void;
    setRpcStatus: (status: RpcStatus) => void;
    setTasks: (tasks: Aria2Task[]) => void;
    setSearchKeyword: (keyword: string) => void;
    toggleSelected: (gid: string) => void;
    setSelected: (gid: string, value: boolean) => void;
    clearSelected: () => void;
    selectAll: () => void;
    setGlobalStat: (stat: GlobalStatData) => void;
    getFilteredTasks: () => Aria2Task[];
    getSelectedTasks: () => Aria2Task[];
    getSelectedTaskIds: () => string[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
    rpcStatus: 'Connecting',
    tasks: [],
    selected: {},
    enableSelectAll: false,
    searchKeyword: '',
    globalStat: {
        downloadSpeed: 0,
        uploadSpeed: 0,
        numActive: 0,
        numWaiting: 0,
        numStopped: 0
    },
    pollingPaused: false,
    setPollingPaused: (value) => set({ pollingPaused: value }),
    setRpcStatus: (status) => set({ rpcStatus: status }),
    setTasks: (tasks) =>
        set({
            tasks,
            enableSelectAll: tasks.length > 0
        }),
    setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
    toggleSelected: (gid) =>
        set((state) => ({
            selected: { ...state.selected, [gid]: !state.selected[gid] }
        })),
    setSelected: (gid, value) =>
        set((state) => ({
            selected: { ...state.selected, [gid]: value }
        })),
    clearSelected: () => set({ selected: {} }),
    selectAll: () => {
        const { tasks, selected, searchKeyword, enableSelectAll } = get();

        if (!enableSelectAll) {
            return;
        }

        const visibleTasks = tasks.filter((task) => filterTask(task, searchKeyword));
        const isAllSelected = visibleTasks.every((task) => selected[task.gid]);
        const next: Record<string, boolean> = { ...selected };

        for (const task of visibleTasks) {
            next[task.gid] = !isAllSelected;
        }

        set({ selected: next, enableSelectAll: true });
    },
    setGlobalStat: (stat) => set({ globalStat: stat }),
    getFilteredTasks: () => {
        const { tasks, searchKeyword } = get();

        return tasks.filter((task) => filterTask(task, searchKeyword));
    },
    getSelectedTasks: () => {
        const { tasks, selected } = get();

        return tasks.filter((task) => selected[task.gid]);
    },
    getSelectedTaskIds: () => {
        const { tasks, selected } = get();

        return tasks.filter((task) => selected[task.gid]).map((task) => task.gid);
    }
}));
