export const ariaNgConstants = {
    title: 'AriaNg',
    appPrefix: 'AriaNg',
    optionStorageKey: 'Options',
    browserNotificationHistoryStorageKey: 'Notifications',
    languageStorageKeyPrefix: 'Language',
    settingHistoryKeyPrefix: 'History',
    languagePath: 'langs',
    languageFileExtension: '.txt',
    defaultLanguage: 'en',
    defaultHost: 'localhost',
    defaultSecureProtocol: 'https',
    defaultPathSeparator: '/',
    httpRequestTimeout: 20000,
    globalStatStorageCapacity: 120,
    taskStatStorageCapacity: 300,
    lazySaveTimeout: 500,
    errorTooltipDelay: 500,
    notificationInPageTimeout: 2000,
    historyMaxStoreCount: 10,
    cachedDebugLogsLimit: 100
} as const;

export interface AriaNgOptions {
    language: string;
    theme: 'light' | 'dark' | 'system';
    title: string;
    titleRefreshInterval: number;
    browserNotification: boolean;
    browserNotificationSound: boolean;
    browserNotificationFrequency: string;
    rpcAlias: string;
    rpcHost: string;
    rpcPort: string;
    rpcInterface: string;
    protocol: string;
    httpMethod: string;
    rpcRequestHeaders: string;
    secret: string;
    extendRpcServers: AriaNgRpcSetting[];
    webSocketReconnectInterval: number;
    globalStatRefreshInterval: number;
    downloadTaskRefreshInterval: number;
    keyboardShortcuts: boolean;
    swipeGesture: boolean;
    dragAndDropTasks: boolean;
    rpcListDisplayOrder: string;
    afterCreatingNewTask: string;
    removeOldTaskAfterRetrying: boolean;
    confirmTaskRemoval: boolean;
    includePrefixWhenCopyingFromTaskDetails: boolean;
    showPiecesInfoInTaskDetailPage: string;
    afterRetryingTask: string;
    taskListIndependentDisplayOrder: boolean;
    displayOrder: string;
    waitingTaskListPageDisplayOrder: string;
    stoppedTaskListPageDisplayOrder: string;
    fileListDisplayOrder: string;
    peerListDisplayOrder: string;
}

export interface AriaNgRpcSetting {
    rpcAlias: string;
    rpcHost: string;
    rpcPort: string;
    rpcInterface: string;
    protocol: string;
    httpMethod: string;
    rpcRequestHeaders: string;
    secret: string;
    isDefault?: boolean;
}

export const ariaNgDefaultOptions: AriaNgOptions = {
    language: 'en',
    theme: 'light',
    title: '${downspeed}, ${upspeed} - ${title}',
    titleRefreshInterval: 5000,
    browserNotification: false,
    browserNotificationSound: true,
    browserNotificationFrequency: 'unlimited',
    rpcAlias: '',
    rpcHost: '',
    rpcPort: '6800',
    rpcInterface: 'jsonrpc',
    protocol: 'http',
    httpMethod: 'POST',
    rpcRequestHeaders: '',
    secret: '',
    extendRpcServers: [],
    webSocketReconnectInterval: 5000,
    globalStatRefreshInterval: 1000,
    downloadTaskRefreshInterval: 1000,
    keyboardShortcuts: true,
    swipeGesture: true,
    dragAndDropTasks: true,
    rpcListDisplayOrder: 'recentlyUsed',
    afterCreatingNewTask: 'task-list',
    removeOldTaskAfterRetrying: false,
    confirmTaskRemoval: true,
    includePrefixWhenCopyingFromTaskDetails: true,
    showPiecesInfoInTaskDetailPage: 'le10240',
    afterRetryingTask: 'task-list-downloading',
    taskListIndependentDisplayOrder: false,
    displayOrder: 'default:asc',
    waitingTaskListPageDisplayOrder: 'default:asc',
    stoppedTaskListPageDisplayOrder: 'default:asc',
    fileListDisplayOrder: 'default:asc',
    peerListDisplayOrder: 'default:asc'
};
