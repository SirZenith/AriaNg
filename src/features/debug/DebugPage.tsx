import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import {
    clearDebugLogs,
    compareLogLevel,
    getDebugLogs,
    subscribeLogs,
    type LogItem,
    type LogLevel,
} from '@/services/log';
import { notifyInPage } from '@/services/notification';
import { aria2RpcService, type RpcInvokeContext } from '@/services/rpc';
import { isEnableDebugMode } from '@/services/settingService';
import type { TaskResponse } from '@/types/aria2';

const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const levelLabels: Record<LogLevel, string> = {
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
};

const levelColors: Record<LogLevel, string> = {
    debug: 'text-gray-500',
    info: 'text-blue-600',
    warn: 'text-amber-600',
    error: 'text-red-600',
};

export default function DebugPage() {
    const { t } = useTranslation();
    const [currentTab, setCurrentTab] = useState<'logs' | 'rpc'>('logs');
    const [logs, setLogs] = useState<LogItem[]>(() => [...getDebugLogs()]);
    const [levelFilter, setLevelFilter] = useState<LogLevel>('debug');
    const [orderDesc, setOrderDesc] = useState(true);
    const [currentLog, setCurrentLog] = useState<LogItem | null>(null);
    const [methods, setMethods] = useState<string[]>([]);
    const [method, setMethod] = useState('');
    const [paramsText, setParamsText] = useState('{}');
    const [responseText, setResponseText] = useState('');

    useEffect(() => subscribeLogs(() => setLogs([...getDebugLogs()])), []);

    useEffect(() => {
        if (currentTab !== 'rpc' || methods.length > 0) {
            return;
        }

        void (async () => {
            const response = await aria2RpcService.listMethods({});

            if (response.success && Array.isArray(response.data)) {
                setMethods(response.data as string[]);
                setMethod((response.data as string[])[0] || '');
            }
        })();
    }, [currentTab, methods.length]);

    const visibleLogs = useMemo(() => {
        const filtered = logs.filter((item) => compareLogLevel(item.level, levelFilter) >= 0);

        return orderDesc ? [...filtered].reverse() : filtered;
    }, [logs, levelFilter, orderDesc]);

    if (!isEnableDebugMode()) {
        return <Navigate to="/settings/ariang" replace />;
    }

    const executeMethod = async () => {
        const parts = method.split('.');

        if (parts.length !== 2) {
            notifyInPage('Error', t('RPC method is illegal!'), { type: 'error', delay: false });
            return;
        }

        const methodFunc = (aria2RpcService as unknown as Record<string, unknown>)[parts[1]];

        if (typeof methodFunc !== 'function') {
            notifyInPage('Error', t('AriaNg does not support this RPC method!'), { type: 'error', delay: false });
            return;
        }

        let params: Record<string, unknown>;

        try {
            params = JSON.parse(paramsText) as Record<string, unknown>;
        } catch {
            notifyInPage('Error', t('RPC request parameters are invalid!'), { type: 'error', delay: false });
            return;
        }

        const context = { ...params } as RpcInvokeContext;
        const result = await (
            methodFunc as (this: typeof aria2RpcService, ctx: RpcInvokeContext) => Promise<TaskResponse>
        ).call(aria2RpcService, context);

        setResponseText(JSON.stringify(result?.data ?? result, null, 2));
    };

    return (
        <section className="rounded bg-white p-4 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold">{t('AriaNg Debug Console')}</h2>

            <div className="mb-3 flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {(['logs', 'rpc'] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        className={
                            'px-3 py-2 text-sm ' +
                            (currentTab === tab
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')
                        }
                        onClick={() => setCurrentTab(tab)}
                    >
                        {tab === 'logs' ? t('Logs') : t('Aria2 RPC Debug')}
                    </button>
                ))}
            </div>

            {currentTab === 'logs' ? (
                <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <select
                            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                            value={levelFilter}
                            onChange={(event) => setLevelFilter(event.target.value as LogLevel)}
                        >
                            {logLevels.map((level) => (
                                <option key={level} value={level}>
                                    {levelLabels[level]}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600"
                            onClick={() => setOrderDesc((value) => !value)}
                        >
                            {orderDesc ? t('Descending') : t('Ascending')}
                        </button>
                        <button
                            type="button"
                            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600"
                            onClick={() => setLogs([...getDebugLogs()])}
                        >
                            {t('Refresh Now')}
                        </button>
                        <button
                            type="button"
                            className="rounded border border-red-300 px-2 py-1 text-sm text-red-600 dark:border-red-700"
                            onClick={() => {
                                if (window.confirm(t('Are you sure you want to clear debug logs?'))) {
                                    clearDebugLogs();
                                }
                            }}
                        >
                            {t('Clear Logs')}
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto rounded border border-gray-200 font-mono text-xs dark:border-gray-700">
                        {visibleLogs.map((item) => (
                            <div
                                key={item.id}
                                className="flex cursor-pointer gap-2 border-b border-gray-100 px-2 py-1 hover:bg-gray-50 last:border-0 dark:border-gray-700 dark:hover:bg-gray-900"
                                onClick={() => setCurrentLog(item)}
                            >
                                <span className="shrink-0 text-gray-400">
                                    {new Date(item.time).toLocaleTimeString()}
                                </span>
                                <span className={'w-12 shrink-0 ' + levelColors[item.level]}>
                                    {levelLabels[item.level]}
                                </span>
                                <span className="break-all">{item.message}</span>
                            </div>
                        ))}

                        {visibleLogs.length < 1 ? (
                            <div className="p-4 text-center text-gray-500">{t('No Data')}</div>
                        ) : null}
                    </div>

                    {currentLog ? (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                            onClick={() => setCurrentLog(null)}
                        >
                            <div
                                className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded bg-white p-4 dark:bg-gray-800"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <h3 className="mb-2 font-semibold">{t('Log Detail')}</h3>
                                <pre className="whitespace-pre-wrap break-all text-xs">
                                    {currentLog.message}
                                    {currentLog.detail !== undefined
                                        ? '\n\n' + JSON.stringify(currentLog.detail, null, 2)
                                        : ''}
                                </pre>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <select
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                        value={method}
                        onChange={(event) => setMethod(event.target.value)}
                    >
                        {methods.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    <textarea
                        className="h-32 rounded border border-gray-300 bg-white px-2 py-1 font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
                        value={paramsText}
                        onChange={(event) => setParamsText(event.target.value)}
                    />
                    <button
                        type="button"
                        className="btn btn-primary self-start px-4 py-2"
                        onClick={() => void executeMethod()}
                    >
                        {t('Execute')}
                    </button>
                    <pre className="max-h-80 overflow-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-gray-900">
                        {responseText || t('No Data')}
                    </pre>
                </div>
            )}
        </section>
    );
}
