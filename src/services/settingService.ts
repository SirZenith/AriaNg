import { ariaNgConstants, ariaNgDefaultOptions, type AriaNgOptions, type AriaNgRpcSetting } from '@/config/constants';
import { ariaNgLanguages } from '@/config/languages';
import { getDefaultLanguage, getLanguageNameFromAlias } from '@/i18n';
import { storageGet, storageSet, storageRemove, storageKeys } from './storage';

function getDefaultHost(): string {
    return window.location.hostname || ariaNgConstants.defaultHost;
}

function getDefaultProtocol(): string {
    return window.location.protocol === 'https:' ? ariaNgConstants.defaultSecureProtocol : 'http';
}

function getLanguageNameFromAliasOrDefaultLanguage(lang: string): string {
    return getLanguageNameFromAlias(lang) || getDefaultLanguage();
}

function initRpcSetting(rpcSetting: AriaNgRpcSetting): void {
    if (!rpcSetting.rpcHost) {
        rpcSetting.rpcHost = getDefaultHost();
    }

    if (!rpcSetting.protocol) {
        rpcSetting.protocol = getDefaultProtocol();
    }
}

export function getOptions(): AriaNgOptions {
    let options = storageGet<AriaNgOptions>(ariaNgConstants.optionStorageKey);

    if (options && !ariaNgLanguages[options.language]) {
        options.language = getLanguageNameFromAliasOrDefaultLanguage(options.language);
    }

    if (!options) {
        options = { ...ariaNgDefaultOptions, language: getDefaultLanguage() };
        initRpcSetting(options);
        setOptions(options);
    }

    return options;
}

export function setOptions(options: AriaNgOptions): void {
    storageSet(ariaNgConstants.optionStorageKey, options);
}

export function getOption<K extends keyof AriaNgOptions>(key: K): AriaNgOptions[K] {
    const options = getOptions();

    if (options[key] === undefined) {
        options[key] = ariaNgDefaultOptions[key];
        setOptions(options);
    }

    return options[key];
}

export function setOption<K extends keyof AriaNgOptions>(key: K, value: AriaNgOptions[K]): void {
    const options = getOptions();
    options[key] = value;
    setOptions(options);
}

export function resetOptions(): void {
    const options = { ...ariaNgDefaultOptions, language: getDefaultLanguage() };
    initRpcSetting(options);
    setOptions(options);
}

export function getCurrentRpcSetting(): AriaNgRpcSetting {
    const options = getOptions();

    return {
        rpcAlias: options.rpcAlias,
        rpcHost: options.rpcHost,
        rpcPort: options.rpcPort,
        rpcInterface: options.rpcInterface,
        protocol: options.protocol,
        httpMethod: options.httpMethod,
        rpcRequestHeaders: options.rpcRequestHeaders,
        secret: options.secret,
    };
}

export function isRpcSettingEquals(left: AriaNgRpcSetting, right: AriaNgRpcSetting): boolean {
    return (
        left.rpcHost === right.rpcHost &&
        left.rpcPort === right.rpcPort &&
        left.rpcInterface === right.rpcInterface &&
        left.protocol === right.protocol &&
        left.secret === right.secret
    );
}

export function getAllRpcSettings(): AriaNgRpcSetting[] {
    const options = getOptions();
    const current = getCurrentRpcSetting();
    const result: AriaNgRpcSetting[] = [];

    for (const server of options.extendRpcServers) {
        if (!server.rpcHost) {
            server.rpcHost = getDefaultHost();
        }

        if (!server.protocol) {
            server.protocol = getDefaultProtocol();
        }

        result.push(server);
    }

    result.push({ ...current, isDefault: true });

    return result;
}

export function addNewRpcSetting(): AriaNgRpcSetting {
    const options = getOptions();
    const setting: AriaNgRpcSetting = {
        rpcAlias: '',
        rpcHost: getDefaultHost(),
        rpcPort: ariaNgDefaultOptions.rpcPort,
        rpcInterface: ariaNgDefaultOptions.rpcInterface,
        protocol: getDefaultProtocol(),
        httpMethod: ariaNgDefaultOptions.httpMethod,
        rpcRequestHeaders: '',
        secret: '',
    };

    options.extendRpcServers.push(setting);
    setOptions(options);

    return setting;
}

export function updateRpcSetting(setting: AriaNgRpcSetting, field: keyof AriaNgRpcSetting, value: string): void {
    const options = getOptions();
    const index = options.extendRpcServers.indexOf(setting);

    if (index >= 0) {
        (options.extendRpcServers[index] as unknown as Record<string, unknown>)[field] = value;
        setOptions(options);
        return;
    }

    setOptions({ ...options, [field]: value });
}

export function removeRpcSetting(setting: AriaNgRpcSetting): void {
    const options = getOptions();
    const index = options.extendRpcServers.indexOf(setting);

    if (index >= 0) {
        options.extendRpcServers.splice(index, 1);
        setOptions(options);
    }
}

export function exportAllOptions(): AriaNgOptions {
    return JSON.parse(JSON.stringify(getOptions())) as AriaNgOptions;
}

export function importAllOptions(settings: Partial<AriaNgOptions>): void {
    setOptions({ ...ariaNgDefaultOptions, ...settings });
}

export function setDefaultRpcSetting(setting: AriaNgRpcSetting): void {
    const options = getOptions();
    const oldDefault = getCurrentRpcSetting();
    const servers = options.extendRpcServers.filter((server) => !isRpcSettingEquals(server, setting));

    if (!isRpcSettingEquals(oldDefault, setting)) {
        servers.push(oldDefault);
    }

    setOptions({
        ...options,
        rpcAlias: setting.rpcAlias,
        rpcHost: setting.rpcHost,
        rpcPort: setting.rpcPort,
        rpcInterface: setting.rpcInterface,
        protocol: setting.protocol,
        httpMethod: setting.httpMethod,
        rpcRequestHeaders: setting.rpcRequestHeaders,
        secret: setting.secret,
        extendRpcServers: servers,
    });
}

export function getCurrentRpcDisplayName(): string {
    const setting = getCurrentRpcSetting();

    if (setting.rpcAlias) {
        return setting.rpcAlias;
    }

    const protocol = setting.protocol || 'http';

    return protocol + '://' + setting.rpcHost + ':' + setting.rpcPort;
}

export function getCurrentRpcUrl(): string {
    const setting = getCurrentRpcSetting();
    const protocol = setting.protocol || 'http';

    return protocol + '://' + setting.rpcHost + ':' + setting.rpcPort + '/' + setting.rpcInterface;
}

export function getCurrentRpcHttpMethod(): string {
    return getCurrentRpcSetting().httpMethod || ariaNgDefaultOptions.httpMethod;
}

export function getCurrentRpcRequestHeaders(): string {
    return getCurrentRpcSetting().rpcRequestHeaders;
}

export function getCurrentRpcSecret(): string {
    return getCurrentRpcSetting().secret;
}

export function isCurrentRpcUseWebSocket(): boolean {
    const protocol = getCurrentRpcSetting().protocol;

    return protocol === 'ws' || protocol === 'wss';
}

export function getLanguage(): string {
    return getOption('language');
}

export function setLanguage(value: string): void {
    setOption('language', value);
}

export function getTheme(): AriaNgOptions['theme'] {
    return getOption('theme');
}

export function setTheme(value: AriaNgOptions['theme']): void {
    setOption('theme', value);
}

export function isBrowserSupportDarkMode(): boolean {
    return (
        typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all'
    );
}

export function getWebSocketReconnectInterval(): number {
    return Number(getOption('webSocketReconnectInterval'));
}

export function getGlobalStatRefreshInterval(): number {
    return Number(getOption('globalStatRefreshInterval'));
}

export function getDownloadTaskRefreshInterval(): number {
    return Number(getOption('downloadTaskRefreshInterval'));
}

export function getTitleRefreshInterval(): number {
    return Number(getOption('titleRefreshInterval'));
}

export function getTitle(): string {
    return getOption('title');
}

export function getDisplayOrder(location: string): string {
    if (getOption('taskListIndependentDisplayOrder')) {
        if (location === 'waiting') {
            return getOption('waitingTaskListPageDisplayOrder');
        }

        if (location === 'stopped') {
            return getOption('stoppedTaskListPageDisplayOrder');
        }
    }

    return getOption('displayOrder');
}

export function getKeyboardShortcuts(): boolean {
    return getOption('keyboardShortcuts');
}

export function getSwipeGesture(): boolean {
    return getOption('swipeGesture');
}

export function getDragAndDropTasks(): boolean {
    return getOption('dragAndDropTasks');
}

export function getAfterCreatingNewTask(): string {
    return getOption('afterCreatingNewTask');
}

export function getAfterRetryingTask(): string {
    return getOption('afterRetryingTask');
}

export function getRemoveOldTaskAfterRetrying(): boolean {
    return getOption('removeOldTaskAfterRetrying');
}

export function getConfirmTaskRemoval(): boolean {
    return getOption('confirmTaskRemoval');
}

export function getIncludePrefixWhenCopyingFromTaskDetails(): boolean {
    return getOption('includePrefixWhenCopyingFromTaskDetails');
}

export function getShowPiecesInfoInTaskDetailPage(): string {
    return getOption('showPiecesInfoInTaskDetailPage');
}

export function getBrowserNotification(): boolean {
    return getOption('browserNotification');
}

export function getBrowserNotificationSound(): boolean {
    return getOption('browserNotificationSound');
}

export function getBrowserNotificationFrequency(): string {
    return getOption('browserNotificationFrequency');
}

export function getSettingHistory(key: string): string[] {
    return storageGet<string[]>(ariaNgConstants.settingHistoryKeyPrefix + '.' + key) || [];
}

export function addSettingHistory(key: string, value: string): string[] {
    const storageKey = ariaNgConstants.settingHistoryKeyPrefix + '.' + key;
    const history = storageGet<string[]>(storageKey) || [];
    const result: string[] = [value];

    for (let i = 0; i < Math.min(history.length, ariaNgConstants.historyMaxStoreCount - 1); i++) {
        if (history[i] !== value) {
            result.push(history[i]);
        }
    }

    storageSet(storageKey, result);

    return result;
}

export function clearSettingHistories(): void {
    for (const key of storageKeys(ariaNgConstants.settingHistoryKeyPrefix + '.')) {
        storageRemove(key);
    }
}

const debugModeStorageKey = ariaNgConstants.appPrefix + '.DebugMode';

export function isEnableDebugMode(): boolean {
    try {
        return window.sessionStorage.getItem(debugModeStorageKey) === 'true';
    } catch {
        return false;
    }
}

export function setDebugMode(value: boolean): void {
    try {
        window.sessionStorage.setItem(debugModeStorageKey, value ? 'true' : 'false');
    } catch {
        // ignore storage errors
    }
}
