import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OptionForm from '@/components/OptionForm';
import { aria2SettingService } from '@/services/aria2SettingService';
import { aria2TaskService } from '@/services/taskService';
import { notifyInPage } from '@/services/notification';
import { addSettingHistory, getAfterCreatingNewTask } from '@/services/settingService';
import { parseUrlsFromOriginInput } from '@/utils/common';

type TaskType = 'urls' | 'torrent' | 'metalink';

function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.substring(result.indexOf(',') + 1));
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

function extractFirstGid(response: unknown): string | null {
    const result = response as { data?: unknown; results?: { data?: unknown }[] };

    if (typeof result?.data === 'string') {
        return result.data;
    }

    if (Array.isArray(result?.results)) {
        for (const item of result.results) {
            if (item && typeof item.data === 'string') {
                return item.data;
            }
        }
    }

    return null;
}

export default function NewTaskPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [taskType, setTaskType] = useState<TaskType>('urls');
    const [urls, setUrls] = useState(() => searchParams.get('uri') || '');
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [options, setOptions] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const availableOptions = useMemo(
        () =>
            aria2SettingService.getSpecifiedOptions(aria2SettingService.getNewTaskOptionKeys(), {
                disableRequired: true,
            }),
        [],
    );

    const setOptionValue = (key: string, value: string) => {
        setOptions((current) => {
            const next = { ...current };

            if (value === '' && !aria2SettingService.isOptionKeyRequired(key)) {
                delete next[key];
            } else {
                next[key] = value;
            }

            return next;
        });
    };

    const gotoAfterCreated = (paused: boolean, response: unknown) => {
        const afterCreating = getAfterCreatingNewTask();

        if (afterCreating === 'current-page') {
            return;
        }

        if (afterCreating === 'task-detail') {
            const gid = extractFirstGid(response);

            if (gid) {
                navigate('/task/detail/' + gid);
                return;
            }
        }

        navigate(paused ? '/waiting' : '/downloading');
    };

    const startDownload = async (pauseOnAdded: boolean) => {
        if (submitting) {
            return;
        }

        setSubmitting(true);

        try {
            if (options.dir) {
                addSettingHistory('dir', options.dir);
            }

            let response: unknown = null;

            if (taskType === 'urls') {
                const urlList = parseUrlsFromOriginInput(urls);

                if (urlList.length < 1) {
                    notifyInPage('Error', t('Please enter at least one valid url'), { type: 'error' });
                    return;
                }

                const tasks = urlList.map((url) => ({ urls: [url], options }));
                response = await aria2TaskService.newUriTasks(tasks, pauseOnAdded);
            } else if (taskType === 'torrent') {
                if (!fileContent) {
                    notifyInPage('Error', t('Please select a torrent file'), { type: 'error' });
                    return;
                }

                response = await aria2TaskService.newTorrentTask({ content: fileContent, options }, pauseOnAdded);
            } else {
                if (!fileContent) {
                    notifyInPage('Error', t('Please select a metalink file'), { type: 'error' });
                    return;
                }

                response = await aria2TaskService.newMetalinkTask({ content: fileContent, options }, pauseOnAdded);
            }

            gotoAfterCreated(pauseOnAdded, response);
        } finally {
            setSubmitting(false);
        }
    };

    const openFile = async (type: 'torrent' | 'metalink', file: File | undefined) => {
        if (!file) {
            return;
        }

        try {
            const content = await readFileAsBase64(file);
            setFileContent(content);
            setFileName(file.name);
            setTaskType(type);
        } catch {
            notifyInPage('Error', t('Cannot read file'), { type: 'error' });
        }
    };

    const inputClass =
        'w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800';

    return (
        <section className="rounded bg-white p-4 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold">{t('New')}</h2>

            <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {(['urls', 'torrent', 'metalink'] as TaskType[]).map((type) => (
                    <button
                        key={type}
                        type="button"
                        className={
                            'px-3 py-2 text-sm ' +
                            (taskType === type
                                ? 'border-b-2 border-[#3c8dbc] text-[#3c8dbc]'
                                : 'text-gray-500 hover:text-gray-700')
                        }
                        onClick={() => setTaskType(type)}
                    >
                        {type === 'urls' ? 'URLs' : type === 'torrent' ? 'Torrent' : 'Metalink'}
                    </button>
                ))}
            </div>

            <div className="mb-4">
                {taskType === 'urls' ? (
                    <div>
                        <label className="mb-1 block text-sm font-medium">{t('Download Links')}</label>
                        <textarea
                            className={inputClass + ' h-32'}
                            value={urls}
                            placeholder={'http://example.org/file\nmagnet:?xt=...'}
                            onChange={(event) => setUrls(event.target.value)}
                        />
                        <div className="mt-1 text-xs text-gray-500">
                            {t('format.task.new.download-links', { count: parseUrlsFromOriginInput(urls).length })}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            {taskType === 'torrent' ? 'Torrent File' : 'Metalink File'}
                        </label>
                        <input
                            type="file"
                            accept={taskType === 'torrent' ? '.torrent' : '.meta4,.metalink'}
                            className="text-sm"
                            onChange={(event) => void openFile(taskType, event.target.files?.[0])}
                        />
                        {fileName ? <div className="mt-1 text-xs text-gray-500">{fileName}</div> : null}
                    </div>
                )}
            </div>

            <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold">{t('Options')}</h3>
                <OptionForm options={availableOptions} values={options} onChange={setOptionValue} />
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={submitting}
                    className="rounded bg-[#3c8dbc] px-4 py-2 text-sm text-white hover:bg-[#367fa9] disabled:opacity-50"
                    onClick={() => void startDownload(false)}
                >
                    {t('Start')}
                </button>
                <button
                    type="button"
                    disabled={submitting}
                    className="rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600 disabled:opacity-50"
                    onClick={() => void startDownload(true)}
                >
                    {t('Pause')}
                </button>
            </div>
        </section>
    );
}
