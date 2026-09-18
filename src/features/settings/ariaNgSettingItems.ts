import type { AriaNgOptions } from '@/config/constants';
import { ariaNgLanguages } from '@/config/languages';
import { isEnableDebugMode } from '@/services/settingService';
import { getTimeOptions } from '@/utils/format';

const refreshTimeList = [1000, 2000, 5000, 10000, 30000, 60000];

export interface AriaNgSettingChoice {
    value: string;
    label?: string;
    labelKey?: string;
    labelParams?: Record<string, unknown>;
}

export type AriaNgSettingSpecial = 'language' | 'browserNotification' | 'debugMode';

export interface AriaNgSettingItem {
    key: keyof AriaNgOptions | 'debug';
    label: string;
    kind: 'select' | 'switch' | 'text';
    choices?: AriaNgSettingChoice[];
    numeric?: boolean;
    special?: AriaNgSettingSpecial;
}

function timeChoices(zeroLabelKey: string): AriaNgSettingChoice[] {
    return getTimeOptions(refreshTimeList, true).map((item) => ({
        value: String(item.optionValue),
        labelKey: item.optionValue === 0 ? zeroLabelKey : item.name,
        labelParams: item.optionValue === 0 ? undefined : { value: item.value },
    }));
}

const languageChoices: AriaNgSettingChoice[] = Object.entries(ariaNgLanguages).map(([key, language]) => ({
    value: key,
    label: language.displayName + ' (' + language.name + ')',
}));

export const ariaNgSettingItems: AriaNgSettingItem[] = [
    { key: 'language', label: 'Language', kind: 'select', choices: languageChoices, special: 'language' },
    {
        key: 'theme',
        label: 'Theme',
        kind: 'select',
        choices: [
            { value: 'light', labelKey: 'Light' },
            { value: 'dark', labelKey: 'Dark' },
            { value: 'system', labelKey: 'Follow system settings' },
        ],
    },
    { key: 'title', label: 'Page Title', kind: 'text' },
    {
        key: 'titleRefreshInterval',
        label: 'Updating Page Title Interval',
        kind: 'select',
        choices: timeChoices('Disabled'),
        numeric: true,
    },
    {
        key: 'globalStatRefreshInterval',
        label: 'Updating Global Stat Interval',
        kind: 'select',
        choices: timeChoices('Disabled'),
        numeric: true,
    },
    {
        key: 'downloadTaskRefreshInterval',
        label: 'Updating Task Information Interval',
        kind: 'select',
        choices: timeChoices('Disabled'),
        numeric: true,
    },
    {
        key: 'webSocketReconnectInterval',
        label: 'WebSocket Auto Reconnect Interval',
        kind: 'select',
        choices: timeChoices('Never'),
        numeric: true,
    },
    {
        key: 'rpcListDisplayOrder',
        label: 'RPC List Display Order',
        kind: 'select',
        choices: [
            { value: 'recentlyUsed', labelKey: 'Recently Used' },
            { value: 'default', labelKey: 'Default' },
        ],
    },
    {
        key: 'displayOrder',
        label: 'Display Order',
        kind: 'select',
        choices: [
            { value: 'default:asc', labelKey: 'Default' },
            { value: 'name:asc', labelKey: 'By File Name' },
            { value: 'size:asc', labelKey: 'By File Size' },
            { value: 'percent:desc', labelKey: 'By Progress' },
            { value: 'remain:asc', labelKey: 'By Remaining' },
            { value: 'dspeed:desc', labelKey: 'By Download Speed' },
            { value: 'uspeed:desc', labelKey: 'By Upload Speed' },
        ],
    },
    {
        key: 'taskListIndependentDisplayOrder',
        label: 'Each Task List Page Uses Independent Display Order',
        kind: 'switch',
    },
    { key: 'dragAndDropTasks', label: 'Change Tasks Order by Drag-and-drop', kind: 'switch' },
    { key: 'keyboardShortcuts', label: 'Keyboard Shortcuts', kind: 'switch' },
    { key: 'swipeGesture', label: 'Swipe Gesture', kind: 'switch' },
    {
        key: 'afterCreatingNewTask',
        label: 'Action After Creating New Tasks',
        kind: 'select',
        choices: [
            { value: 'task-list', labelKey: 'Navigate to Task List Page' },
            { value: 'task-detail', labelKey: 'Navigate to Task Detail Page' },
            { value: 'current-page', labelKey: 'Stay on Current Page' },
        ],
    },
    {
        key: 'afterRetryingTask',
        label: 'Action After Retrying Task',
        kind: 'select',
        choices: [
            { value: 'task-list', labelKey: 'Navigate to Task List Page' },
            { value: 'task-list-downloading', labelKey: 'Navigate to Downloading Tasks Page' },
            { value: 'task-detail', labelKey: 'Navigate to Task Detail Page' },
        ],
    },
    { key: 'removeOldTaskAfterRetrying', label: 'Remove Old Tasks After Retrying', kind: 'switch' },
    { key: 'confirmTaskRemoval', label: 'Confirm Task Removal', kind: 'switch' },
    {
        key: 'includePrefixWhenCopyingFromTaskDetails',
        label: 'Include Prefix When Copying From Task Details',
        kind: 'switch',
    },
    {
        key: 'showPiecesInfoInTaskDetailPage',
        label: 'Show Pieces Info In Task Detail Page',
        kind: 'select',
        choices: [
            { value: 'never', labelKey: 'Never' },
            { value: 'le1024', labelKey: 'Up to 1024 Pieces' },
            { value: 'le10240', labelKey: 'Up to 10240 Pieces' },
            { value: 'le102400', labelKey: 'Up to 102400 Pieces' },
            { value: 'always', labelKey: 'Always' },
        ],
    },
    {
        key: 'browserNotification',
        label: 'Enable Browser Notification',
        kind: 'switch',
        special: 'browserNotification',
    },
    { key: 'browserNotificationSound', label: 'Browser Notification Sound', kind: 'switch' },
    {
        key: 'browserNotificationFrequency',
        label: 'Browser Notification Frequency',
        kind: 'select',
        choices: [
            { value: 'unlimited', labelKey: 'Unlimited' },
            { value: 'high', labelKey: 'High (Up to 10 Notifications / 1 Minute)' },
            { value: 'middle', labelKey: 'Middle (Up to 1 Notification / 1 Minute)' },
            { value: 'low', labelKey: 'Low (Up to 1 Notification / 5 Minutes)' },
        ],
    },
    { key: 'debug', label: 'Debug Mode', kind: 'switch', special: 'debugMode' },
];

export function getAriaNgSettingItem(key: string): AriaNgSettingItem | undefined {
    return ariaNgSettingItems.find((item) => item.key === key);
}

export function getAriaNgSettingValue(options: AriaNgOptions, item: AriaNgSettingItem): string {
    if (item.key === 'debug') {
        return isEnableDebugMode() ? 'true' : 'false';
    }

    return String(options[item.key]);
}
