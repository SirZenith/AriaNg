import { log } from './log';
import { aria2RpcService, type RpcInvokeContext } from './rpc';
import { getRemoveOldTaskAfterRetrying } from './settingService';
import type { Aria2Peer, Aria2Task, TaskResponse } from '@/types/aria2';
import { processBtPeers, processDownloadTask } from '@/utils/task';

type TaskCallback = (response: TaskResponse) => void;

export const aria2TaskService = {
    getTaskList(
        type: string,
        full: boolean,
        callback?: TaskCallback,
        silent?: boolean,
    ): Promise<TaskResponse> | undefined {
        let invokeMethod: ((context: RpcInvokeContext) => Promise<TaskResponse>) | null = null;

        if (type === 'downloading') {
            invokeMethod = (context) => aria2RpcService.tellActive(context);
        } else if (type === 'waiting') {
            invokeMethod = (context) => aria2RpcService.tellWaiting(context);
        } else if (type === 'stopped') {
            invokeMethod = (context) => aria2RpcService.tellStopped(context);
        } else {
            return undefined;
        }

        return invokeMethod({
            requestWholeInfo: full,
            requestParams: full ? aria2RpcService.getFullTaskParams() : aria2RpcService.getBasicTaskParams(),
            silent: !!silent,
            callback,
        });
    },
    getTaskStatus(
        gid: string,
        callback?: TaskCallback,
        silent?: boolean,
        addVirtualFileNode?: boolean,
    ): Promise<TaskResponse> {
        return aria2RpcService.tellStatus({
            gid,
            silent: !!silent,
            callback: (response: TaskResponse) => {
                if (response.success && response.data) {
                    processDownloadTask(response.data as Aria2Task, addVirtualFileNode);
                }

                callback?.(response);
            },
        });
    },
    getTaskOptions(gid: string, callback?: TaskCallback, silent?: boolean) {
        return aria2RpcService.getOption({
            gid,
            silent: !!silent,
            callback,
        });
    },
    setTaskOption(
        gid: string,
        key: string,
        value: string,
        callback?: (response: TaskResponse) => void,
        silent?: boolean,
    ) {
        const options: Record<string, string> = {};
        options[key] = value;

        return aria2RpcService.changeOption({
            gid,
            options,
            silent: !!silent,
            callback,
        });
    },
    selectTaskFile(
        gid: string,
        selectedFileIndexArr: (string | number)[],
        callback?: (response: TaskResponse) => void,
        silent?: boolean,
    ) {
        return this.setTaskOption(gid, 'select-file', selectedFileIndexArr.join(','), callback, silent);
    },
    async getTaskStatusAndBtPeers(
        gid: string,
        callback?: (response: TaskResponse & { task?: Aria2Task; peers?: Aria2Peer[] }) => void,
        silent?: boolean,
        requirePeers?: boolean,
        includeLocalPeer?: boolean,
        addVirtualFileNode?: boolean,
    ): Promise<TaskResponse & { task?: Aria2Task; peers?: Aria2Peer[] }> {
        const methods = [aria2RpcService.buildMethodCall('tellStatus', gid)];

        if (requirePeers) {
            methods.push(aria2RpcService.buildMethodCall('getPeers', gid));
        }

        const response = await aria2RpcService.multicall({ methods, silent: !!silent });
        const result: TaskResponse & { task?: Aria2Task; peers?: Aria2Peer[] } = { ...response };
        const data = Array.isArray(response.data) ? (response.data as unknown[][]) : [];

        if (response.success && data.length > 0 && data[0].length > 0) {
            const task = data[0][0] as Aria2Task;
            processDownloadTask(task, addVirtualFileNode);
            result.task = task;
        }

        if (response.success && result.task && result.task.bittorrent && data.length > 1 && data[1].length > 0) {
            const peers = data[1][0] as Aria2Peer[];
            processBtPeers(peers, result.task, includeLocalPeer);
            result.peers = peers;
        }

        callback?.(result);

        return result;
    },
    getBtTaskPeers(task: Aria2Task, callback?: TaskCallback, silent?: boolean, includeLocalPeer?: boolean) {
        return aria2RpcService.getPeers({
            gid: task.gid,
            silent: !!silent,
            callback: (response) => {
                if (response.success && Array.isArray(response.data)) {
                    processBtPeers(response.data as Aria2Peer[], task, includeLocalPeer);
                }

                callback?.(response);
            },
        });
    },
    newUriTask(
        task: { urls: string[]; options: Record<string, string> },
        pauseOnAdded: boolean,
        callback?: (response: TaskResponse) => void,
        silent?: boolean,
    ) {
        return aria2RpcService.addUri({
            task,
            pauseOnAdded: !!pauseOnAdded,
            silent: !!silent,
            callback,
        });
    },
    newUriTasks(
        tasks: { urls: string[]; options: Record<string, string> }[],
        pauseOnAdded: boolean,
        callback?: (response: TaskResponse) => void,
        silent?: boolean,
    ) {
        return aria2RpcService.addUriMulti({
            tasks,
            pauseOnAdded: !!pauseOnAdded,
            silent: !!silent,
            callback,
        });
    },
    newTorrentTask(
        task: { content: string; options: Record<string, string> },
        pauseOnAdded: boolean,
        callback?: (response: TaskResponse) => void,
        silent?: boolean,
    ) {
        return aria2RpcService.addTorrent({
            task,
            pauseOnAdded: !!pauseOnAdded,
            silent: !!silent,
            callback,
        });
    },
    newMetalinkTask(
        task: { content: string; options: Record<string, string> },
        pauseOnAdded: boolean,
        callback?: (response: TaskResponse) => void,
        silent?: boolean,
    ) {
        return aria2RpcService.addMetalink({
            task,
            pauseOnAdded: !!pauseOnAdded,
            silent: !!silent,
            callback,
        });
    },
    startTasks(gids: string[], callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.unpauseMulti({
            gids,
            silent: !!silent,
            callback,
        });
    },
    pauseTasks(gids: string[], callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.forcePauseMulti({
            gids,
            silent: !!silent,
            callback,
        });
    },
    async retryTask(gid: string, callback?: (response: TaskResponse) => void, silent?: boolean): Promise<TaskResponse> {
        const response = (await aria2RpcService.multicall({
            methods: [
                aria2RpcService.buildMethodCall('tellStatus', gid),
                aria2RpcService.buildMethodCall('getOption', gid),
            ],
            silent: !!silent,
        })) as TaskResponse<unknown[][]>;

        if (!response.success || !response.data) {
            callback?.({ success: false });
            return { success: false };
        }

        const data = response.data as unknown[][];
        const task = (data.length > 0 ? data[0][0] : null) as Aria2Task | null;
        const options = (data.length > 1 ? data[1][0] : null) as Record<string, string> | null;

        if (!task || !options || !task.files || task.files.length !== 1 || task.bittorrent) {
            log.warn('[aria2TaskService.retryTask] task is not retryable', task);
            callback?.({ success: false });
            return { success: false };
        }

        const file = task.files[0];
        const urls: string[] = [];

        if (file.uris) {
            for (const uriItem of file.uris) {
                urls.push(uriItem.uri);
            }
        }

        const addResponse = await aria2RpcService.addUri({
            task: { urls, options },
            pauseOnAdded: false,
            silent: !!silent,
        });

        if (!addResponse.success) {
            callback?.(addResponse);
            return addResponse;
        }

        if (getRemoveOldTaskAfterRetrying()) {
            await aria2RpcService.removeDownloadResult({ gid, silent: true });
        }

        callback?.(addResponse);

        return addResponse;
    },
    async retryTasks(
        tasks: Aria2Task[],
        callback?: (response: TaskResponse) => void,
        silent?: boolean,
    ): Promise<TaskResponse> {
        let successCount = 0;
        let failedCount = 0;

        for (const task of tasks) {
            const response = await this.retryTask(task.gid, undefined, silent);

            if (response.success) {
                successCount++;
            } else {
                failedCount++;
            }
        }

        const finalResponse: TaskResponse = {
            success: successCount > 0,
            successCount,
            failedCount,
            hasSuccess: successCount > 0,
            hasError: failedCount > 0,
        };

        callback?.(finalResponse);

        return finalResponse;
    },
    async removeTasks(
        tasks: Aria2Task[],
        callback?: (response: TaskResponse) => void,
        silent?: boolean,
    ): Promise<TaskResponse> {
        const runningTaskGids: string[] = [];
        const stoppedTaskGids: string[] = [];

        for (const task of tasks) {
            if (task.status === 'complete' || task.status === 'error' || task.status === 'removed') {
                stoppedTaskGids.push(task.gid);
            } else {
                runningTaskGids.push(task.gid);
            }
        }

        const results: TaskResponse[] = [];
        let hasSuccess = false;
        let hasError = false;

        if (runningTaskGids.length > 0) {
            const response = await aria2RpcService.forceRemoveMulti({ gids: runningTaskGids, silent: !!silent });
            results.push(...response.results);
            hasSuccess = hasSuccess || response.hasSuccess;
            hasError = hasError || response.hasError;
        }

        if (stoppedTaskGids.length > 0) {
            const response = await aria2RpcService.removeDownloadResultMulti({
                gids: stoppedTaskGids,
                silent: !!silent,
            });
            results.push(...response.results);
            hasSuccess = hasSuccess || response.hasSuccess;
            hasError = hasError || response.hasError;
        }

        const finalResponse: TaskResponse = { success: hasSuccess, hasSuccess, hasError, results };
        callback?.(finalResponse);

        return finalResponse;
    },
    changeTaskPosition(gid: string, position: number, callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.changePosition({
            gid,
            pos: position,
            how: 'POS_SET',
            silent: !!silent,
            callback,
        });
    },
    clearStoppedTasks(callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.purgeDownloadResult({
            silent: !!silent,
            callback,
        });
    },
    onConnectionSuccess(callback: (context: unknown) => void): void {
        aria2RpcService.onConnectionSuccess({ callback });
    },
    onConnectionFailed(callback: (context: unknown) => void): void {
        aria2RpcService.onConnectionFailed({ callback });
    },
    onConnectionReconnecting(callback: (context: unknown) => void): void {
        aria2RpcService.onConnectionReconnecting({ callback });
    },
    onConnectionWaitingToReconnect(callback: (context: unknown) => void): void {
        aria2RpcService.onConnectionWaitingToReconnect({ callback });
    },
    onFirstSuccess(callback: (context: unknown) => void): void {
        aria2RpcService.onFirstSuccess({ callback });
    },
    onOperationSuccess(callback: (context: unknown) => void): void {
        aria2RpcService.onOperationSuccess({ callback });
    },
    onOperationError(callback: (context: unknown) => void): void {
        aria2RpcService.onOperationError({ callback });
    },
    onTaskCompleted(callback: (context: unknown) => void): void {
        aria2RpcService.onDownloadComplete({
            callback: (event) => {
                const gid = (event as { gid?: string } | null)?.gid;

                if (!gid) {
                    callback({ type: 'completed', task: null });
                    return;
                }

                void this.getTaskStatus(
                    gid,
                    (response) => {
                        callback({ type: 'completed', task: response.success ? response.data : null });
                    },
                    true,
                );
            },
        });
    },
    onBtTaskCompleted(callback: (context: unknown) => void): void {
        aria2RpcService.onBtDownloadComplete({
            callback: (event) => {
                const gid = (event as { gid?: string } | null)?.gid;

                if (!gid) {
                    callback({ type: 'btcompleted', task: null });
                    return;
                }

                void this.getTaskStatus(
                    gid,
                    (response) => {
                        callback({ type: 'btcompleted', task: response.success ? response.data : null });
                    },
                    true,
                );
            },
        });
    },
    onTaskErrorOccur(callback: (context: unknown) => void): void {
        aria2RpcService.onDownloadError({
            callback: (event) => {
                const gid = (event as { gid?: string } | null)?.gid;

                if (!gid) {
                    callback({ type: 'error', task: null });
                    return;
                }

                void this.getTaskStatus(
                    gid,
                    (response) => {
                        callback({ type: 'error', task: response.success ? response.data : null });
                    },
                    true,
                );
            },
        });
    },
};
