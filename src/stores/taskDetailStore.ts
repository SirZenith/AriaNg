import { create } from 'zustand';

interface TaskDetailState {
    gid: string | null;
    taskName: string;
    setTaskName: (gid: string, taskName: string) => void;
}

export const useTaskDetailStore = create<TaskDetailState>((set) => ({
    gid: null,
    taskName: '',
    setTaskName: (gid, taskName) => set({ gid, taskName }),
}));
