import { ariaNgConstants } from '@/config/constants';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogItem {
    id: number;
    time: number;
    level: LogLevel;
    message: string;
    detail?: unknown;
}

const logLevelWeight: Record<string, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const cachedLogs: LogItem[] = [];
const listeners = new Set<() => void>();

let debugEnabled = false;
let logId = 0;

export function setEnableDebugLog(value: boolean): void {
    debugEnabled = value;
}

export function isDebugLogEnabled(): boolean {
    return debugEnabled;
}

export function getDebugLogs(): LogItem[] {
    return cachedLogs;
}

export function subscribeLogs(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

function notify(): void {
    for (const listener of listeners) {
        listener();
    }
}

function push(level: LogLevel, message: string, detail?: unknown): void {
    const item: LogItem = {
        id: ++logId,
        time: Date.now(),
        level,
        message,
        detail,
    };

    cachedLogs.push(item);

    if (cachedLogs.length > ariaNgConstants.cachedDebugLogsLimit) {
        cachedLogs.splice(0, cachedLogs.length - ariaNgConstants.cachedDebugLogsLimit);
    }

    notify();
}

export function compareLogLevel(level1: LogLevel, level2: LogLevel): number {
    return logLevelWeight[level1] - logLevelWeight[level2];
}

export const log = {
    debug(message: string, detail?: unknown): void {
        if (!debugEnabled) {
            return;
        }

        console.debug(message, detail);
        push('debug', message, detail);
    },
    info(message: string, detail?: unknown): void {
        console.info(message, detail);
        push('info', message, detail);
    },
    warn(message: string, detail?: unknown): void {
        console.warn(message, detail);
        push('warn', message, detail);
    },
    error(message: string, detail?: unknown): void {
        console.error(message, detail);
        push('error', message, detail);
    },
};

export function clearDebugLogs(): void {
    cachedLogs.length = 0;
    notify();
}
