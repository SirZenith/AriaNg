export type Aria2TaskStatus = 'active' | 'waiting' | 'paused' | 'error' | 'complete' | 'removed';

export type Aria2OptionType = 'string' | 'integer' | 'float' | 'text' | 'boolean' | 'option';

export interface Aria2OptionSetting {
    since?: string;
    type: Aria2OptionType;
    suffix?: string;
    readonly?: boolean;
    defaultValue?: string;
    required?: boolean;
    separator?: string;
    overrideMode?: 'override' | 'append';
    submitFormat?: 'string' | 'array';
    showCount?: boolean;
    trimCount?: boolean;
    options?: string[];
    min?: number;
    max?: number;
    pattern?: string;
}

export interface Aria2Uri {
    uri: string;
    status: string;
}

export interface Aria2File {
    index: string | number;
    path: string;
    length: string | number;
    completedLength: string | number;
    selected: string | boolean;
    uris?: Aria2Uri[];
    fileName?: string;
    relativePath?: string;
    completePercent?: number;
    level?: number;
    isDir?: boolean;
    nodePath?: string;
    nodeName?: string;
    nodeType?: string;
    partialSelected?: boolean;
    files?: Aria2File[];
    subDirs?: Aria2File[];
    [key: string]: unknown;
}

export interface Aria2BitTorrentInfo {
    name?: string;
}

export interface Aria2BitTorrent {
    announceList?: string[][];
    comment?: string;
    creationDate?: number;
    mode?: 'single' | 'multi';
    info?: Aria2BitTorrentInfo;
}

export interface Aria2Task {
    gid: string;
    status: Aria2TaskStatus | string;
    totalLength: string | number;
    completedLength: string | number;
    uploadLength?: string | number;
    downloadSpeed: string | number;
    uploadSpeed: string | number;
    connections?: string | number;
    numSeeders?: string | number;
    seeder?: string | boolean;
    errorCode?: string;
    errorDescription?: string;
    verifiedLength?: string | number;
    verifyIntegrityPending?: string | boolean;
    infoHash?: string;
    dir?: string;
    files?: Aria2File[];
    bittorrent?: Aria2BitTorrent;
    bitfield?: string;
    numPieces?: string;
    pieceLength?: string;
    completePercent?: number;
    remainLength?: number;
    remainPercent?: number;
    shareRatio?: number;
    idle?: boolean;
    remainTime?: number;
    verifiedPercent?: number;
    taskName?: string;
    hasTaskName?: boolean;
    selectedFileCount?: number;
    singleUrl?: string;
    multiDir?: boolean;
    completedPieces?: number;
    [key: string]: unknown;
}

export interface Aria2Peer {
    peerId?: string;
    ip: string;
    port: string;
    bitfield?: string;
    amChoking?: string;
    peerChoking?: string;
    downloadSpeed: string | number;
    uploadSpeed: string | number;
    seeder?: string | boolean;
    name?: string;
    completePercent?: number;
    local?: boolean;
    client?: {
        name: string;
        version: string;
        info?: string;
    };
    [key: string]: unknown;
}

export interface Aria2GlobalStat {
    downloadSpeed: string;
    uploadSpeed: string;
    numActive: string;
    numWaiting: string;
    numStopped: string;
    numStoppedTotal?: string;
    [key: string]: unknown;
}

export interface Aria2Server {
    index: string;
    servers: {
        uri: string;
        currentUri: string;
        downloadSpeed: string;
    }[];
}

export interface Aria2Version {
    version: string;
    enabledFeatures: string[];
}

export interface Aria2SessionInfo {
    sessionId: string;
}

export interface Aria2RpcError {
    code: number;
    message: string;
}

export interface Aria2RpcResponse<T = unknown> {
    id: string;
    jsonrpc: string;
    result?: T;
    error?: Aria2RpcError;
}

export interface Aria2TaskContext {
    callback?: (response: TaskResponse) => void;
    silent?: boolean;
    gid?: string;
    options?: Record<string, string>;
    task?: {
        urls?: string[];
        content?: string;
        options?: Record<string, string>;
    };
    [key: string]: unknown;
}

export interface TaskResponse<T = unknown> {
    id?: string;
    success: boolean;
    data?: T;
    errorProcessed?: boolean;
    context?: Record<string, unknown>;
    [key: string]: unknown;
}
