import { create } from 'zustand';

export type TaskType = 'urls' | 'torrent' | 'metalink';

interface NewTaskState {
    taskType: TaskType;
    urls: string;
    fileContent: string | null;
    fileName: string;
    options: Record<string, string>;
    setTaskType: (taskType: TaskType) => void;
    setUrls: (urls: string) => void;
    setFileContent: (fileContent: string | null) => void;
    setFileName: (fileName: string) => void;
    setOptions: (options: Record<string, string>) => void;
    reset: () => void;
}

const initialState = {
    taskType: 'urls' as TaskType,
    urls: '',
    fileContent: null,
    fileName: '',
    options: {},
};

export const useNewTaskStore = create<NewTaskState>((set) => ({
    ...initialState,
    setTaskType: (taskType) => set({ taskType }),
    setUrls: (urls) => set({ urls }),
    setFileContent: (fileContent) => set({ fileContent }),
    setFileName: (fileName) => set({ fileName }),
    setOptions: (options) => set({ options }),
    reset: () => set(initialState),
}));
