import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, Pause, Play, Settings2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { aria2TaskService } from '@/services/taskService';
import { notifyInPage } from '@/services/notification';
import { addSettingHistory, getAfterCreatingNewTask } from '@/services/settingService';
import { parseUrlsFromOriginInput } from '@/utils/common';
import TopBar from '@/components/TopBar';
import ReturnToolbar from '@/components/ReturnToolbar';
import SplitBottomBar from '@/components/SplitBottomBar';
import { useNewTaskStore, type TaskType } from '@/stores/newTaskStore';

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
    const result = response as { data?: unknown; results?: { data?: unknown; }[]; };

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

    const taskType = useNewTaskStore((state) => state.taskType);
    const urls = useNewTaskStore((state) => state.urls);
    const fileContent = useNewTaskStore((state) => state.fileContent);
    const fileName = useNewTaskStore((state) => state.fileName);
    const options = useNewTaskStore((state) => state.options);
    const setTaskType = useNewTaskStore((state) => state.setTaskType);
    const setUrls = useNewTaskStore((state) => state.setUrls);
    const setFileContent = useNewTaskStore((state) => state.setFileContent);
    const setFileName = useNewTaskStore((state) => state.setFileName);
    const reset = useNewTaskStore((state) => state.reset);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const uri = searchParams.get('uri');

        if (uri) {
            setUrls(uri);
        }
    }, [searchParams, setUrls]);

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

        navigate(paused ? '/tasks/waiting' : '/tasks/downloading');
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
            reset();
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
        <>
            <TopBar>
                <ReturnToolbar title={t('New')}></ReturnToolbar>
            </TopBar>

            <section className="mt-4 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
                <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
                    {(['urls', 'torrent', 'metalink'] as TaskType[]).map((type) => (
                        <button
                            key={type}
                            type="button"
                            className={
                                'px-3 py-2 text-sm ' +
                                (taskType === type
                                    ? 'border-b-2 border-primary text-primary'
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
                                {t(taskType === 'torrent' ? 'Torrent File' : 'Metalink File')}
                            </label>
                            <label className="btn btn-primary btn-sm cursor-pointer">
                                <FileUp className="h-4 w-4" aria-hidden="true" />
                                {t('Select File')}
                                <input
                                    type="file"
                                    accept={taskType === 'torrent' ? '.torrent' : '.meta4,.metalink'}
                                    className="hidden"
                                    onChange={(event) => void openFile(taskType, event.target.files?.[0])}
                                />
                            </label>
                            {fileName ? <div className="mt-1 text-xs text-gray-500">{fileName}</div> : null}
                        </div>
                    )}
                </div>
            </section>

            <SplitBottomBar
                leading={
                    <>
                        <button
                            type="button"
                            disabled={submitting}
                            className="bottom-bar-item bottom-bar-item-active"
                            title={t('Start')}
                            aria-label={t('Start')}
                            onClick={() => void startDownload(false)}
                        >
                            <Play className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden md:inline">{t('Start')}</span>
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            className="bottom-bar-item"
                            title={t('Pause')}
                            aria-label={t('Pause')}
                            onClick={() => void startDownload(true)}
                        >
                            <Pause className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden md:inline">{t('Pause')}</span>
                        </button>
                    </>
                }
                trailing={
                    <button
                        type="button"
                        className="bottom-bar-item"
                        title={t('Task Settings')}
                        aria-label={t('Task Settings')}
                        onClick={() => navigate('/new/settings')}
                    >
                        <Settings2 className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Task Settings')}</span>
                    </button>
                }
            />
        </>
    );
}
