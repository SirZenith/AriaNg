import { getCurrentRpcUrl, getWebSocketReconnectInterval } from '@/services/settingService';
import { log } from '@/services/log';
import type { RpcConnectionCallbacks, RpcErrorPayload, RpcRequestBody, RpcResultPayload, RpcTransport } from './types';

interface MessageContent {
    id?: string;
    result?: unknown;
    error?: RpcErrorPayload;
    method?: string;
    params?: unknown[];
}

export function createWebSocketTransport(): RpcTransport {
    const rpcUrl = getCurrentRpcUrl();

    const sendStates = new Map<string, (result: RpcResultPayload) => void>();
    const eventCallbacks: Record<string, ((params: unknown) => void)[]> = {};

    let socket: WebSocket | null = null;
    let pendingReconnect: number | null = null;
    let activeCallbacks: RpcConnectionCallbacks = {};

    function handleMessage(data: string): void {
        let content: MessageContent;

        try {
            content = JSON.parse(data) as MessageContent;
        } catch {
            return;
        }

        if (content.id) {
            const resolve = sendStates.get(content.id);

            if (!resolve) {
                return;
            }

            sendStates.delete(content.id);
            resolve({ id: content.id, result: content.result, error: content.error });
        } else if (content.method) {
            const callbacks = eventCallbacks[content.method];

            if (!callbacks) {
                return;
            }

            const context = Array.isArray(content.params) && content.params.length > 0 ? content.params[0] : null;

            for (const callback of callbacks) {
                callback(context);
            }
        }
    }

    function planToReconnect(): void {
        if (pendingReconnect !== null) {
            return;
        }

        pendingReconnect = window.setTimeout(() => {
            pendingReconnect = null;
            connect();
            activeCallbacks.onConnectionReconnecting?.();
        }, getWebSocketReconnectInterval());
    }

    function handleClose(): void {
        log.warn('[websocket] connection closed');

        for (const [id, resolve] of sendStates) {
            resolve({ id, error: { message: 'Cannot connect to aria2!' } });
        }

        sendStates.clear();

        if (getWebSocketReconnectInterval() > 0) {
            activeCallbacks.onConnectionWaitingToReconnect?.();
            planToReconnect();
        } else {
            activeCallbacks.onConnectionFailed?.();
        }
    }

    function connect(): WebSocket {
        if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
            return socket;
        }

        log.debug('[websocket] connecting to ' + rpcUrl);

        socket = new WebSocket(rpcUrl);
        socket.onmessage = (event) => handleMessage(event.data as string);
        socket.onopen = () => {
            log.debug('[websocket] connection opened');
            activeCallbacks.onConnectionSuccess?.();
        };
        socket.onclose = () => handleClose();
        socket.onerror = () => {
            // onclose will be triggered afterwards
        };

        return socket;
    }

    return {
        request(body: RpcRequestBody, callbacks: RpcConnectionCallbacks): Promise<RpcResultPayload> {
            const currentSocket = connect();
            activeCallbacks = callbacks;

            return new Promise((resolve) => {
                sendStates.set(body.id, resolve);

                const send = () => {
                    try {
                        currentSocket.send(JSON.stringify(body));
                    } catch {
                        sendStates.delete(body.id);
                        resolve({ id: body.id, error: { message: 'Cannot connect to aria2!' } });
                    }
                };

                if (currentSocket.readyState === WebSocket.OPEN) {
                    send();
                } else {
                    currentSocket.addEventListener('open', send, { once: true });
                }
            });
        },
        reconnect(callbacks: RpcConnectionCallbacks): void {
            activeCallbacks = callbacks;

            if (socket) {
                try {
                    socket.close();
                } catch {
                    // ignore
                }
            }

            socket = null;
            connect();
        },
        on(eventName: string, callback: (params: unknown) => void): void {
            if (!eventCallbacks[eventName]) {
                eventCallbacks[eventName] = [];
            }

            eventCallbacks[eventName].push(callback);
        },
    };
}
