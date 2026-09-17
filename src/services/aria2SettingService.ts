import { aria2AllOptions } from '@/config/aria2Options';
import {
    aria2GlobalAvailableOptions,
    aria2QuickSettingsAvailableOptions,
    aria2TaskAvailableOptions,
    type Aria2TaskOptionKey,
} from '@/config/aria2OptionGroups';
import type { Aria2OptionType } from '@/types/aria2';
import {
    addSettingHistory,
    clearSettingHistories,
    getSettingHistory,
    isCurrentRpcUseWebSocket,
} from './settingService';
import { log } from './log';
import { aria2RpcService, type RpcInvokeContext } from './rpc';
import type { TaskResponse } from '@/types/aria2';

export interface Aria2OptionValueItem {
    name: string;
    value: string;
}

export interface Aria2OptionItem {
    key: string;
    nameKey: string;
    descriptionKey: string;
    type: Aria2OptionType;
    category?: string;
    suffix?: string;
    readonly?: boolean;
    defaultValue?: string;
    required?: boolean;
    separator?: string;
    overrideMode?: 'override' | 'append';
    submitFormat?: 'string' | 'array';
    showCount?: boolean;
    trimCount?: boolean;
    options?: Aria2OptionValueItem[];
    min?: number;
    max?: number;
    pattern?: string;
    showHistory?: boolean;
}

export interface Aria2GlobalStatResult extends Record<string, unknown> {
    totalRunningCount?: number;
}

function processStatResult(stat: Aria2GlobalStatResult): Aria2GlobalStatResult {
    if (stat) {
        stat.totalRunningCount = parseInt(String(stat.numActive)) + parseInt(String(stat.numWaiting));
    }

    return stat;
}

export const aria2SettingService = {
    isOptionKeyValid(key: string): boolean {
        return !!aria2AllOptions[key];
    },
    isOptionKeyRequired(key: string): boolean {
        return !!aria2AllOptions[key]?.required;
    },
    getAvailableGlobalOptionsKeys(type: string): string[] | false {
        if (type === 'basic') {
            return aria2GlobalAvailableOptions.basicOptions;
        } else if (type === 'http-ftp-sftp') {
            return aria2GlobalAvailableOptions.httpFtpSFtpOptions;
        } else if (type === 'http') {
            return aria2GlobalAvailableOptions.httpOptions;
        } else if (type === 'ftp-sftp') {
            return aria2GlobalAvailableOptions.ftpSFtpOptions;
        } else if (type === 'bt') {
            return aria2GlobalAvailableOptions.btOptions;
        } else if (type === 'metalink') {
            return aria2GlobalAvailableOptions.metalinkOptions;
        } else if (type === 'rpc') {
            return aria2GlobalAvailableOptions.rpcOptions;
        } else if (type === 'advanced') {
            return aria2GlobalAvailableOptions.advancedOptions;
        }

        return false;
    },
    getAria2QuickSettingsAvailableOptions(type: string): string[] | false {
        if (type === 'globalSpeedLimit') {
            return aria2QuickSettingsAvailableOptions.globalSpeedLimitOptions;
        }

        return false;
    },
    getAvailableTaskOptionKeys(status: string, isBittorrent: boolean): Aria2TaskOptionKey[] {
        const availableOptions: Aria2TaskOptionKey[] = [];

        for (const option of aria2TaskAvailableOptions.taskOptions) {
            const optionKey: Aria2TaskOptionKey = { key: option.key, category: option.category };

            if (option.canShow && option.canShow.indexOf(status) < 0) {
                continue;
            }

            if (option.category === 'http' && isBittorrent) {
                continue;
            } else if (option.category === 'bittorrent' && !isBittorrent) {
                continue;
            }

            if (option.canUpdate && option.canUpdate.indexOf(status) < 0) {
                optionKey.readonly = true;
            }

            availableOptions.push(optionKey);
        }

        return availableOptions;
    },
    getNewTaskOptionKeys(): Aria2TaskOptionKey[] {
        const availableOptions: Aria2TaskOptionKey[] = [];

        for (const option of aria2TaskAvailableOptions.taskOptions) {
            const optionKey: Aria2TaskOptionKey = {
                key: option.key,
                category: option.category,
                showHistory: option.showHistory,
            };

            if (option.canShow && option.canShow.indexOf('new') < 0) {
                continue;
            }

            if (option.canUpdate && option.canUpdate.indexOf('new') < 0) {
                optionKey.readonly = true;
            }

            availableOptions.push(optionKey);
        }

        return availableOptions;
    },
    getSpecifiedOptions(
        keys: (string | Aria2TaskOptionKey)[],
        extendSettings?: { disableRequired?: boolean },
    ): Aria2OptionItem[] {
        const options: Aria2OptionItem[] = [];

        if (!keys) {
            return options;
        }

        for (const item of keys) {
            let key: string;
            let readonly = false;
            let category: string | undefined;
            let showHistory = false;

            if (typeof item === 'object') {
                key = item.key;
                readonly = !!item.readonly;
                category = item.category;
                showHistory = !!item.showHistory;
            } else {
                key = item;
            }

            const rawOption = aria2AllOptions[key];

            if (!rawOption) {
                continue;
            }

            const option: Aria2OptionItem = {
                ...(rawOption as unknown as Aria2OptionItem),
                key,
                nameKey: 'options.' + key + '.name',
                descriptionKey: 'options.' + key + '.description',
                category,
                options: undefined,
            };

            if (option.type === 'boolean') {
                option.options = [
                    { name: 'option.true', value: 'true' },
                    { name: 'option.false', value: 'false' },
                ];
            } else if (Array.isArray(rawOption.options) && rawOption.options.length > 0) {
                option.options = (rawOption.options as string[]).map((value) => ({
                    name: 'option.' + value,
                    value,
                }));
            }

            if (readonly) {
                option.readonly = true;
            }

            if (showHistory) {
                option.showHistory = true;
            }

            if (extendSettings && extendSettings.disableRequired) {
                option.required = false;
            }

            options.push(option);
        }

        return options;
    },
    getSettingHistory(key: string): string[] {
        return this.isOptionKeyValid(key) ? getSettingHistory(key) : [];
    },
    addSettingHistory(key: string, value: string): string[] {
        return this.isOptionKeyValid(key) ? addSettingHistory(key, value) : [];
    },
    clearSettingsHistorys(): void {
        clearSettingHistories();
    },
    getGlobalOption(callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.getGlobalOption({
            silent: !!silent,
            callback,
        });
    },
    setGlobalOption(key: string, value: string, callback?: (response: TaskResponse) => void, silent?: boolean) {
        const options: Record<string, string> = {};
        options[key] = value;

        return aria2RpcService.changeGlobalOption({
            options,
            silent: !!silent,
            callback,
        });
    },
    getAria2Status(callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.getVersion({
            silent: !!silent,
            callback,
        });
    },
    getGlobalStat(callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.getGlobalStat({
            silent: !!silent,
            callback: (response: TaskResponse) => {
                if (!callback) {
                    log.warn('[aria2SettingService.getGlobalStat] callback is null');
                    return;
                }

                if (response.success && response.data) {
                    processStatResult(response.data as Aria2GlobalStatResult);
                }

                callback(response);
            },
        });
    },
    canReconnect(): boolean {
        return isCurrentRpcUseWebSocket();
    },
    reconnect(callback?: (response: TaskResponse) => void): void {
        aria2RpcService.reconnect({ callback } as RpcInvokeContext);
    },
    saveSession(callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.saveSession({
            silent: !!silent,
            callback,
        });
    },
    shutdown(callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.shutdown({
            silent: !!silent,
            callback,
        });
    },
    forceShutdown(callback?: (response: TaskResponse) => void, silent?: boolean) {
        return aria2RpcService.forceShutdown({
            silent: !!silent,
            callback,
        });
    },
};
