export interface RpcRequestBody {
    jsonrpc: string;
    method: string;
    id: string;
    params?: unknown[];
}

export interface RpcErrorPayload {
    code?: number;
    message: string;
}

export interface RpcResultPayload {
    id: string;
    result?: unknown;
    error?: RpcErrorPayload;
}

export interface RpcConnectionCallbacks {
    onConnectionSuccess?: () => void;
    onConnectionFailed?: () => void;
    onConnectionReconnecting?: () => void;
    onConnectionWaitingToReconnect?: () => void;
}

export interface RpcTransport {
    request(body: RpcRequestBody, callbacks: RpcConnectionCallbacks): Promise<RpcResultPayload>;
    reconnect(callbacks: RpcConnectionCallbacks): void;
    on(eventName: string, callback: (params: unknown) => void): void;
}
