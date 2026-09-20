import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, Pause, Play, Settings2 } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { aria2TaskService } from '@/services/taskService';
import { notifyInPage } from '@/services/notification';
import { addSettingHistory, getAfterCreatingNewTask } from '@/services/settingService';
import { parseUrlsFromOriginInput } from '@/utils/common';
import TopBar from '@/components/TopBar';
import TopBarTabs from '@/components/TopBarTabs';
import ReturnToolbar from '@/components/ReturnToolbar';
import BottomBarButton from '@/components/BottomBarButton';
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
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const from = (location.state as { from?: string } | null)?.from || '/tasks/downloading';

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

    return (
        <>
            <TopBar>
                <ReturnToolbar title={t('New')} to={from}></ReturnToolbar>

                <TopBarTabs
                    tabs={(['urls', 'torrent', 'metalink'] as TaskType[]).map((type) => ({
                        key: type,
                        label: type === 'urls' ? 'URLs' : type === 'torrent' ? 'Torrent' : 'Metalink',
                        onClick: () => setTaskType(type),
                    }))}
                    activeKey={taskType}
                />
            </TopBar>

            <section className="panel mt-4 p-4 sm:p-5">
                {taskType === 'urls' ? (
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">{t('Download Links')}</label>
                        <textarea
                            className="input h-32 resize-y"
                            value={urls}
                            placeholder={'http://example.org/file\nmagnet:?xt=...'}
                            onChange={(event) => setUrls(event.target.value)}
                        />
                        <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            {t('format.task.new.download-links', { count: parseUrlsFromOriginInput(urls).length })}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            {t(taskType === 'torrent' ? 'Torrent File' : 'Metalink File')}
                        </label>
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 transition-colors hover:border-primary hover:text-primary dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary-light dark:hover:text-primary-light">
                            <FileUp className="h-6 w-6" aria-hidden="true" />
                            <span>{t('Select File')}</span>
                            <input
                                type="file"
                                accept={taskType === 'torrent' ? '.torrent' : '.meta4,.metalink'}
                                className="hidden"
                                onChange={(event) => void openFile(taskType, event.target.files?.[0])}
                            />
                        </label>
                        {fileName ? (
                            <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">{fileName}</div>
                        ) : null}
                    </div>
                )}
            </section>

            <SplitBottomBar
                leading={
                    <BottomBarButton
                        ariaLabel={t('Task Settings')}
                        label={t('Task Settings')}
                        icon={Settings2}
                        iconClassName="text-primary dark:text-primary-light"
                        onClick={() => navigate('/new/settings', { state: { from } })}
                    />
                }
                trailing={
                    <>
                        <BottomBarButton
                            ariaLabel={t('Pause')}
                            label={t('Pause')}
                            icon={Pause}
                            iconClassName="text-amber-600 dark:text-amber-400"
                            disabled={submitting}
                            onClick={() => void startDownload(true)}
                        />
                        <BottomBarButton
                            ariaLabel={t('Start')}
                            label={t('Start')}
                            icon={Play}
                            iconClassName="text-green-600 dark:text-green-500"
                            disabled={submitting}
                            onClick={() => void startDownload(false)}
                        />
                    </>
                }
                restrictWidth
            />
        </>
    );
}
