export const aria2RpcConstants = {
    rpcServiceVersion: '2.0',
    rpcServiceName: 'aria2',
    rpcSystemServiceName: 'system',
    rpcTokenPrefix: 'token:'
} as const;

export interface Aria2RpcError {
    message: string;
    tipTextKey?: string;
}

export const aria2RpcErrors: Record<string, Aria2RpcError> = {
    Unauthorized: {
        message: 'Unauthorized',
        tipTextKey: 'rpc.error.unauthorized'
    }
};
