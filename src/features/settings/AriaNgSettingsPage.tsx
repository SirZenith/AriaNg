import { useTranslation } from 'react-i18next';
import type { AriaNgOptions } from '@/config/constants';
import { ariaNgLanguages } from '@/config/languages';
import { hasBrowserPermission, requestBrowserPermission } from '@/services/browserNotification';
import { isEnableDebugMode, resetOptions, setDebugMode } from '@/services/settingService';
import { getBuildCommit, getBuildVersion } from '@/services/version';
import { useSettingStore } from '@/stores/settingStore';
import { getTimeOptions } from '@/utils/format';
import ImportExportSection from './ImportExportSection';
import RpcSettingsSection from './RpcSettingsSection';

const refreshTimeList = [1000, 2000, 5000, 10000, 30000, 60000];

const inputClass =
    'w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:items-center">
            <label className="text-sm font-medium">{label}</label>
            <div className="sm:col-span-2">{children}</div>
        </div>
    );
}

export default function AriaNgSettingsPage() {
    const { t, i18n } = useTranslation();
    const options = useSettingStore((state) => state.options);
    const setOption = useSettingStore((state) => state.setOption);

    const timeOptions = getTimeOptions(refreshTimeList, true);

    const resetAll = () => {
        if (!window.confirm(t('Are you sure you want to reset all settings?'))) {
            return;
        }

        resetOptions();
        window.location.reload();
    };

    return (
        <section className="max-w-4xl rounded bg-white p-4 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold">{t('AriaNg Settings')}</h2>

            <div className="flex flex-col gap-3">
                <Field label={t('Language')}>
                    <select
                        className={inputClass}
                        value={options.language}
                        onChange={(event) => {
                            setOption('language', event.target.value);
                            void i18n.changeLanguage(event.target.value);
                        }}
                    >
                        {Object.entries(ariaNgLanguages).map(([key, language]) => (
                            <option key={key} value={key}>
                                {language.displayName} ({language.name})
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label={t('Theme')}>
                    <select
                        className={inputClass}
                        value={options.theme}
                        onChange={(event) => setOption('theme', event.target.value as AriaNgOptions['theme'])}
                    >
                        <option value="light">{t('Light')}</option>
                        <option value="dark">{t('Dark')}</option>
                        <option value="system">{t('Follow system settings')}</option>
                    </select>
                </Field>

                <Field label={t('Page Title')}>
                    <input
                        className={inputClass}
                        value={options.title}
                        onChange={(event) => setOption('title', event.target.value)}
                    />
                </Field>

                <Field label={t('Updating Page Title Interval')}>
                    <select
                        className={inputClass}
                        value={options.titleRefreshInterval}
                        onChange={(event) => setOption('titleRefreshInterval', Number(event.target.value))}
                    >
                        {timeOptions.map((item) => (
                            <option key={item.optionValue} value={item.optionValue}>
                                {item.optionValue === 0 ? t('Disabled') : t(item.name, { value: item.value })}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label={t('Updating Global Stat Interval')}>
                    <select
                        className={inputClass}
                        value={options.globalStatRefreshInterval}
                        onChange={(event) => setOption('globalStatRefreshInterval', Number(event.target.value))}
                    >
                        {timeOptions.map((item) => (
                            <option key={item.optionValue} value={item.optionValue}>
                                {item.optionValue === 0 ? t('Disabled') : t(item.name, { value: item.value })}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label={t('Updating Task Information Interval')}>
                    <select
                        className={inputClass}
                        value={options.downloadTaskRefreshInterval}
                        onChange={(event) => setOption('downloadTaskRefreshInterval', Number(event.target.value))}
                    >
                        {timeOptions.map((item) => (
                            <option key={item.optionValue} value={item.optionValue}>
                                {item.optionValue === 0 ? t('Disabled') : t(item.name, { value: item.value })}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label={t('WebSocket Auto Reconnect Interval')}>
                    <select
                        className={inputClass}
                        value={options.webSocketReconnectInterval}
                        onChange={(event) => setOption('webSocketReconnectInterval', Number(event.target.value))}
                    >
                        {timeOptions.map((item) => (
                            <option key={item.optionValue} value={item.optionValue}>
                                {item.optionValue === 0 ? t('Never') : t(item.name, { value: item.value })}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label={t('RPC List Display Order')}>
                    <select
                        className={inputClass}
                        value={options.rpcListDisplayOrder}
                        onChange={(event) => setOption('rpcListDisplayOrder', event.target.value)}
                    >
                        <option value="recentlyUsed">{t('Recently Used')}</option>
                        <option value="default">{t('Default')}</option>
                    </select>
                </Field>

                <Field label={t('Display Order')}>
                    <select
                        className={inputClass}
                        value={options.displayOrder}
                        onChange={(event) => setOption('displayOrder', event.target.value)}
                    >
                        <option value="default:asc">{t('Default')}</option>
                        <option value="name:asc">{t('By File Name')}</option>
                        <option value="size:asc">{t('By File Size')}</option>
                        <option value="percent:desc">{t('By Progress')}</option>
                        <option value="remain:asc">{t('By Remaining')}</option>
                        <option value="dspeed:desc">{t('By Download Speed')}</option>
                        <option value="uspeed:desc">{t('By Upload Speed')}</option>
                    </select>
                </Field>

                <Field label={t('Each Task List Page Uses Independent Display Order')}>
                    <input
                        type="checkbox"
                        checked={options.taskListIndependentDisplayOrder}
                        onChange={(event) => setOption('taskListIndependentDisplayOrder', event.target.checked)}
                    />
                </Field>

                <Field label={t('Change Tasks Order by Drag-and-drop')}>
                    <input
                        type="checkbox"
                        checked={options.dragAndDropTasks}
                        onChange={(event) => setOption('dragAndDropTasks', event.target.checked)}
                    />
                </Field>

                <Field label={t('Keyboard Shortcuts')}>
                    <input
                        type="checkbox"
                        checked={options.keyboardShortcuts}
                        onChange={(event) => setOption('keyboardShortcuts', event.target.checked)}
                    />
                </Field>

                <Field label={t('Swipe Gesture')}>
                    <input
                        type="checkbox"
                        checked={options.swipeGesture}
                        onChange={(event) => setOption('swipeGesture', event.target.checked)}
                    />
                </Field>

                <Field label={t('Action After Creating New Tasks')}>
                    <select
                        className={inputClass}
                        value={options.afterCreatingNewTask}
                        onChange={(event) => setOption('afterCreatingNewTask', event.target.value)}
                    >
                        <option value="task-list">{t('Navigate to Task List Page')}</option>
                        <option value="task-detail">{t('Navigate to Task Detail Page')}</option>
                        <option value="current-page">{t('Stay on Current Page')}</option>
                    </select>
                </Field>

                <Field label={t('Action After Retrying Task')}>
                    <select
                        className={inputClass}
                        value={options.afterRetryingTask}
                        onChange={(event) => setOption('afterRetryingTask', event.target.value)}
                    >
                        <option value="task-list">{t('Navigate to Task List Page')}</option>
                        <option value="task-list-downloading">{t('Navigate to Downloading Tasks Page')}</option>
                        <option value="task-detail">{t('Navigate to Task Detail Page')}</option>
                    </select>
                </Field>

                <Field label={t('Remove Old Tasks After Retrying')}>
                    <input
                        type="checkbox"
                        checked={options.removeOldTaskAfterRetrying}
                        onChange={(event) => setOption('removeOldTaskAfterRetrying', event.target.checked)}
                    />
                </Field>

                <Field label={t('Confirm Task Removal')}>
                    <input
                        type="checkbox"
                        checked={options.confirmTaskRemoval}
                        onChange={(event) => setOption('confirmTaskRemoval', event.target.checked)}
                    />
                </Field>

                <Field label={t('Include Prefix When Copying From Task Details')}>
                    <input
                        type="checkbox"
                        checked={options.includePrefixWhenCopyingFromTaskDetails}
                        onChange={(event) => setOption('includePrefixWhenCopyingFromTaskDetails', event.target.checked)}
                    />
                </Field>

                <Field label={t('Show Pieces Info In Task Detail Page')}>
                    <select
                        className={inputClass}
                        value={options.showPiecesInfoInTaskDetailPage}
                        onChange={(event) => setOption('showPiecesInfoInTaskDetailPage', event.target.value)}
                    >
                        <option value="never">{t('Never')}</option>
                        <option value="le1024">{t('Up to 1024 Pieces')}</option>
                        <option value="le10240">{t('Up to 10240 Pieces')}</option>
                        <option value="le102400">{t('Up to 102400 Pieces')}</option>
                        <option value="always">{t('Always')}</option>
                    </select>
                </Field>

                <Field label={t('Enable Browser Notification')}>
                    <input
                        type="checkbox"
                        checked={options.browserNotification}
                        onChange={(event) => {
                            const enabled = event.target.checked;

                            void (async () => {
                                if (enabled && !hasBrowserPermission()) {
                                    const granted = await requestBrowserPermission();

                                    if (!granted) {
                                        return;
                                    }
                                }

                                setOption('browserNotification', enabled);
                            })();
                        }}
                    />
                </Field>

                <Field label={t('Browser Notification Sound')}>
                    <input
                        type="checkbox"
                        checked={options.browserNotificationSound}
                        onChange={(event) => setOption('browserNotificationSound', event.target.checked)}
                    />
                </Field>

                <Field label={t('Browser Notification Frequency')}>
                    <select
                        className={inputClass}
                        value={options.browserNotificationFrequency}
                        onChange={(event) => setOption('browserNotificationFrequency', event.target.value)}
                    >
                        <option value="unlimited">{t('Unlimited')}</option>
                        <option value="high">{t('High (Up to 10 Notifications / 1 Minute)')}</option>
                        <option value="middle">{t('Middle (Up to 1 Notification / 1 Minute)')}</option>
                        <option value="low">{t('Low (Up to 1 Notification / 5 Minutes)')}</option>
                    </select>
                </Field>

                <Field label={t('Debug Mode')}>
                    <input
                        type="checkbox"
                        defaultChecked={isEnableDebugMode()}
                        onChange={(event) => {
                            setDebugMode(event.target.checked);
                            window.location.reload();
                        }}
                    />
                </Field>
            </div>

            <hr className="my-6 border-gray-200 dark:border-gray-700" />
            <RpcSettingsSection />

            <hr className="my-6 border-gray-200 dark:border-gray-700" />
            <ImportExportSection />

            <div className="mt-6">
                <button
                    type="button"
                    className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                    onClick={resetAll}
                >
                    {t('Reset Settings')}
                </button>
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                {t('AriaNg Version')}: {getBuildVersion()} ({getBuildCommit()})
            </p>
        </section>
    );
}
