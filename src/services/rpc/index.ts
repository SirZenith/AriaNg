import i18n from '@/i18n';
import { aria2AllOptions } from '@/config/aria2Options';
import { aria2RpcConstants, aria2RpcErrors } from '@/config/aria2RpcConstants';
import { log } from '@/services/log';
import { notifyInPage } from '@/services/notification';
import { getCurrentRpcDisplayName, getCurrentRpcSecret, isCurrentRpcUseWebSocket } from '@/services/settingService';
import { generateUniqueId } from '@/utils/common';
import type { Aria2RpcError, TaskResponse } from '@/types/aria2';
import { createHttpTransport } from './http';
import { createWebSocketTransport } from './websocket';
import type { RpcConnectionCallbacks, RpcErrorPayload, RpcTransport } from './types';

export interface RpcInvokeContext {
    callback?: (response: TaskResponse) => void;
    silent?: boolean;
    pauseOnAdded?: boolean;
    task?: {
        urls?: string[];
        content?: string;
        options?: Record<string, string>;
    };
    [key: string]: unknown;
}

type EventCallback = (context: unknown) => void;

const eventListeners: Record<string, EventCallback[]> = {};

function addEventListener(name: string, callback: EventCallback): void {
    if (!eventListeners[name]) {
        eventListeners[name] = [];
    }

    eventListeners[name].push(callback);
}

function fireEvent(name: string, context?: unknown): void {
    const callbacks = eventListeners[name];

    if (!callbacks) {
        return;
    }

    for (const callback of callbacks) {
        callback(context);
    }
}

const secret = getCurrentRpcSecret();
const transport: RpcTransport = isCurrentRpcUseWebSocket() ? createWebSocketTransport() : createHttpTransport();

let isConnected = false;

const aria2Events = [
    'onDownloadStart',
    'onDownloadPause',
    'onDownloadStop',
    'onDownloadComplete',
    'onDownloadError',
    'onBtDownloadComplete',
];

for (const eventName of aria2Events) {
    transport.on(aria2RpcConstants.rpcServiceName + '.' + eventName, (context) => {
        fireEvent(eventName, context);
    });
}

function processError(error: RpcErrorPayload | Aria2RpcError): boolean {
    if (!error || !error.message) {
        return false;
    }

    log.error('[aria2RpcService.processError] ' + error.message, error);

    const knownError = aria2RpcErrors[error.message];

    if (knownError && knownError.tipTextKey) {
        notifyInPage('Error', i18n.t(knownError.tipTextKey), { type: 'error', delay: false });
    } else {
        notifyInPage('Error', error.message, { type: 'error', delay: false });
    }

    return true;
}

function buildRequestOptions(
    originalOptions: Record<string, string>,
    context?: RpcInvokeContext,
): Record<string, unknown> {
    const options: Record<string, unknown> = { ...originalOptions };

    for (const optionName of Object.keys(options)) {
        const setting = aria2AllOptions[optionName];
        const value = options[optionName];

        if (setting && setting.submitFormat === 'array' && typeof value === 'string') {
            const items = value.split(setting.separator || ',');
            const result: string[] = [];

            for (const item of items) {
                if (item) {
                    result.push(item.replace('\r', ''));
                }
            }

            options[optionName] = result;
        }
    }

    if (context && context.pauseOnAdded) {
        options.pause = 'true';
    }

    return options;
}

function invoke<T = unknown>(
    methodName: string,
    context: RpcInvokeContext,
    ...params: unknown[]
): Promise<TaskResponse<T>> {
    const isSystemMethod = methodName.indexOf(aria2RpcConstants.rpcSystemServiceName + '.') === 0;
    const fullMethodName = isSystemMethod ? methodName : aria2RpcConstants.rpcServiceName + '.' + methodName;
    const uniqueId = generateUniqueId();
    const finalParams: unknown[] = [];

    if (secret && !isSystemMethod) {
        finalParams.push(aria2RpcConstants.rpcTokenPrefix + secret);
    }

    for (const param of params) {
        if (param !== null && param !== undefined) {
            finalParams.push(param);
        }
    }

    const requestBody = {
        jsonrpc: aria2RpcConstants.rpcServiceVersion,
        method: fullMethodName,
        id: uniqueId,
        params: finalParams.length > 0 ? finalParams : undefined,
    };

    const callbacks: RpcConnectionCallbacks = {
        onConnectionSuccess: () => fireEvent('connectionSuccess', {}),
        onConnectionFailed: () => fireEvent('connectionFailed', {}),
        onConnectionReconnecting: () => fireEvent('connectionReconnecting', {}),
        onConnectionWaitingToReconnect: () => fireEvent('connectionWaitingToReconnect', {}),
    };

    return transport.request(requestBody, callbacks).then((payload) => {
        if (payload.error) {
            if (!context.silent) {
                processError(payload.error);
            }

            fireEvent('operationError', {});

            const response: TaskResponse<T> = {
                id: payload.id,
                success: false,
                data: payload.error as unknown as T,
                context,
            };

            context.callback?.(response as TaskResponse);

            return response;
        }

        fireEvent('operationSuccess', {});

        if (!isConnected) {
            isConnected = true;
            fireEvent('firstSuccess', { rpcName: getCurrentRpcDisplayName() });
        }

        const response: TaskResponse<T> = {
            id: payload.id,
            success: true,
            data: payload.result as T,
            context,
        };

        context.callback?.(response as TaskResponse);

        return response;
    });
}

async function invokeMulti<T>(
    method: (context: RpcInvokeContext) => Promise<TaskResponse<T>>,
    contexts: RpcInvokeContext[],
): Promise<{ hasSuccess: boolean; hasError: boolean; results: TaskResponse<T>[] }> {
    const results: TaskResponse<T>[] = [];
    let hasSuccess = false;
    let hasError = false;

    await Promise.all(
        contexts.map(async (context) => {
            const response = await method(context);
            results.push(response);
            hasSuccess = hasSuccess || response.success;
            hasError = hasError || !response.success;
        }),
    );

    return { hasSuccess, hasError, results };
}

export const aria2RpcService = {
    getBasicTaskParams(): string[] {
        return [
            'gid',
            'totalLength',
            'completedLength',
            'uploadSpeed',
            'downloadSpeed',
            'connections',
            'numSeeders',
            'seeder',
            'status',
            'errorCode',
            'verifiedLength',
            'verifyIntegrityPending',
        ];
    },
    getFullTaskParams(): string[] {
        return [...this.getBasicTaskParams(), 'files', 'bittorrent', 'infoHash'];
    },
    buildMethodCall(methodName: string, ...params: unknown[]): { methodName: string; params: unknown[] } {
        const isSystemMethod = methodName.indexOf(aria2RpcConstants.rpcSystemServiceName + '.') === 0;
        const finalParams: unknown[] = [];

        if (secret && !isSystemMethod) {
            finalParams.push(aria2RpcConstants.rpcTokenPrefix + secret);
        }

        for (const param of params) {
            if (param !== null && param !== undefined) {
                finalParams.push(param);
            }
        }

        return {
            methodName: isSystemMethod ? methodName : aria2RpcConstants.rpcServiceName + '.' + methodName,
            params: finalParams,
        };
    },
    canReconnect(): boolean {
        return isCurrentRpcUseWebSocket();
    },
    reconnect(context: RpcInvokeContext): void {
        log.info('[aria2RpcService.reconnect] reconnect now');
        transport.reconnect({
            onConnectionSuccess: () => fireEvent('connectionSuccess', {}),
            onConnectionFailed: () => fireEvent('connectionFailed', {}),
            onConnectionReconnecting: () => fireEvent('connectionReconnecting', {}),
            onConnectionWaitingToReconnect: () => fireEvent('connectionWaitingToReconnect', {}),
        });

        if (context && context.callback) {
            context.callback({ success: true });
        }
    },
    addUri(context: RpcInvokeContext): Promise<TaskResponse<string>> {
        const urls = context.task?.urls ?? null;
        const options = buildRequestOptions(context.task?.options ?? {}, context);

        return invoke<string>('addUri', context, urls, options);
    },
    async addUriMulti(
        context: RpcInvokeContext,
    ): Promise<{ hasSuccess: boolean; hasError: boolean; results: TaskResponse<string>[] }> {
        const tasks = (context.tasks as { urls?: string[]; options?: Record<string, string> }[]) || [];
        const contexts: RpcInvokeContext[] = tasks.map((task) => ({
            silent: !!context.silent,
            task,
            pauseOnAdded: context.pauseOnAdded,
        }));

        const result = await invokeMulti<string>((ctx) => this.addUri(ctx), contexts);
        context.callback?.(result as unknown as TaskResponse);

        return result;
    },
    addTorrent(context: RpcInvokeContext): Promise<TaskResponse<string>> {
        const content = context.task?.content ?? null;
        const options = buildRequestOptions(context.task?.options ?? {}, context);

        return invoke<string>('addTorrent', context, content, [], options);
    },
    addMetalink(context: RpcInvokeContext): Promise<TaskResponse<string>> {
        const content = context.task?.content ?? null;
        const options = buildRequestOptions(context.task?.options ?? {}, context);

        return invoke<string>('addMetalink', context, content, options);
    },
    remove(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('remove', context, context.gid);
    },
    forceRemove(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('forceRemove', context, context.gid);
    },
    async forceRemoveMulti(
        context: RpcInvokeContext,
    ): Promise<{ hasSuccess: boolean; hasError: boolean; results: TaskResponse[] }> {
        const gids = (context.gids as string[]) || [];
        const contexts: RpcInvokeContext[] = gids.map((gid) => ({ silent: !!context.silent, gid }));

        const result = await invokeMulti((ctx) => this.forceRemove(ctx), contexts);
        context.callback?.(result as unknown as TaskResponse);

        return result;
    },
    pause(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('pause', context, context.gid);
    },
    forcePause(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('forcePause', context, context.gid);
    },
    async forcePauseMulti(
        context: RpcInvokeContext,
    ): Promise<{ hasSuccess: boolean; hasError: boolean; results: TaskResponse[] }> {
        const gids = (context.gids as string[]) || [];
        const contexts: RpcInvokeContext[] = gids.map((gid) => ({ silent: !!context.silent, gid }));

        const result = await invokeMulti((ctx) => this.forcePause(ctx), contexts);
        context.callback?.(result as unknown as TaskResponse);

        return result;
    },
    pauseAll(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('pauseAll', context);
    },
    unpause(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('unpause', context, context.gid);
    },
    async unpauseMulti(
        context: RpcInvokeContext,
    ): Promise<{ hasSuccess: boolean; hasError: boolean; results: TaskResponse[] }> {
        const gids = (context.gids as string[]) || [];
        const contexts: RpcInvokeContext[] = gids.map((gid) => ({ silent: !!context.silent, gid }));

        const result = await invokeMulti((ctx) => this.unpause(ctx), contexts);
        context.callback?.(result as unknown as TaskResponse);

        return result;
    },
    unpauseAll(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('unpauseAll', context);
    },
    tellStatus(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('tellStatus', context, context.gid);
    },
    getUris(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('getUris', context, context.gid);
    },
    getFiles(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('getFiles', context, context.gid);
    },
    getPeers(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('getPeers', context, context.gid);
    },
    getServers(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('getServers', context, context.gid);
    },
    tellActive(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('tellActive', context, context.requestParams ?? null);
    },
    tellWaiting(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke(
            'tellWaiting',
            context,
            context.offset !== undefined ? context.offset : 0,
            context.num !== undefined ? context.num : 1000,
            context.requestParams ?? null,
        );
    },
    tellStopped(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke(
            'tellStopped',
            context,
            context.offset !== undefined ? context.offset : -1,
            context.num !== undefined ? context.num : 1000,
            context.requestParams ?? null,
        );
    },
    changePosition(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('changePosition', context, context.gid, context.pos, context.how);
    },
    getOption(context: RpcInvokeContext): Promise<TaskResponse<Record<string, string>>> {
        return invoke<Record<string, string>>('getOption', context, context.gid);
    },
    changeOption(context: RpcInvokeContext): Promise<TaskResponse> {
        const options = buildRequestOptions((context.options as Record<string, string>) ?? {}, context);

        return invoke('changeOption', context, context.gid, options);
    },
    getGlobalOption(context: RpcInvokeContext): Promise<TaskResponse<Record<string, string>>> {
        return invoke<Record<string, string>>('getGlobalOption', context);
    },
    changeGlobalOption(context: RpcInvokeContext): Promise<TaskResponse> {
        const options = buildRequestOptions((context.options as Record<string, string>) ?? {}, context);

        return invoke('changeGlobalOption', context, options);
    },
    getGlobalStat(context: RpcInvokeContext): Promise<TaskResponse<Record<string, string>>> {
        return invoke<Record<string, string>>('getGlobalStat', context);
    },
    purgeDownloadResult(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('purgeDownloadResult', context);
    },
    removeDownloadResult(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('removeDownloadResult', context, context.gid);
    },
    async removeDownloadResultMulti(
        context: RpcInvokeContext,
    ): Promise<{ hasSuccess: boolean; hasError: boolean; results: TaskResponse[] }> {
        const gids = (context.gids as string[]) || [];
        const contexts: RpcInvokeContext[] = gids.map((gid) => ({ silent: !!context.silent, gid }));

        const result = await invokeMulti((ctx) => this.removeDownloadResult(ctx), contexts);
        context.callback?.(result as unknown as TaskResponse);

        return result;
    },
    getVersion(context: RpcInvokeContext): Promise<TaskResponse<Record<string, unknown>>> {
        return invoke<Record<string, unknown>>('getVersion', context);
    },
    getSessionInfo(context: RpcInvokeContext): Promise<TaskResponse<Record<string, unknown>>> {
        return invoke<Record<string, unknown>>('getSessionInfo', context);
    },
    shutdown(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('shutdown', context);
    },
    forceShutdown(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('forceShutdown', context);
    },
    saveSession(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('saveSession', context);
    },
    multicall(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('system.multicall', context, context.methods);
    },
    listMethods(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('system.listMethods', context);
    },
    listNotifications(context: RpcInvokeContext): Promise<TaskResponse> {
        return invoke('system.listNotifications', context);
    },
    onFirstSuccess(context: { callback: EventCallback }): void {
        addEventListener('firstSuccess', context.callback);
    },
    onOperationSuccess(context: { callback: EventCallback }): void {
        addEventListener('operationSuccess', context.callback);
    },
    onOperationError(context: { callback: EventCallback }): void {
        addEventListener('operationError', context.callback);
    },
    onConnectionSuccess(context: { callback: EventCallback }): void {
        addEventListener('connectionSuccess', context.callback);
    },
    onConnectionFailed(context: { callback: EventCallback }): void {
        addEventListener('connectionFailed', context.callback);
    },
    onConnectionReconnecting(context: { callback: EventCallback }): void {
        addEventListener('connectionReconnecting', context.callback);
    },
    onConnectionWaitingToReconnect(context: { callback: EventCallback }): void {
        addEventListener('connectionWaitingToReconnect', context.callback);
    },
    onDownloadStart(context: { callback: EventCallback }): void {
        addEventListener('onDownloadStart', context.callback);
    },
    onDownloadPause(context: { callback: EventCallback }): void {
        addEventListener('onDownloadPause', context.callback);
    },
    onDownloadStop(context: { callback: EventCallback }): void {
        addEventListener('onDownloadStop', context.callback);
    },
    onDownloadComplete(context: { callback: EventCallback }): void {
        addEventListener('onDownloadComplete', context.callback);
    },
    onDownloadError(context: { callback: EventCallback }): void {
        addEventListener('onDownloadError', context.callback);
    },
    onBtDownloadComplete(context: { callback: EventCallback }): void {
        addEventListener('onBtDownloadComplete', context.callback);
    },
};
