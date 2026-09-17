import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import type { AriaNgRpcSetting } from '@/config/constants';
import { copyText } from '@/utils/clipboard';
import { base64UrlEncode } from '@/utils/common';

export interface ExportCommandData {
    type: 'new-task' | 'setting';
    data: unknown;
}

interface ExportCommandApiDialogProps {
    options: ExportCommandData;
    onClose: () => void;
}

interface NewTaskItem {
    urls: string[];
    options?: Record<string, string>;
}

function getBaseUrl(): string {
    return window.location.origin + window.location.pathname;
}

export default function ExportCommandApiDialog({ options, onClose }: ExportCommandApiDialogProps) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const commandUrl = useMemo(() => {
        const baseUrl = getBaseUrl();

        if (options.type === 'new-task') {
            const tasks = (Array.isArray(options.data) ? options.data : []) as NewTaskItem[];

            return tasks
                .map((task) => {
                    let url = baseUrl + '#!/new/task?url=' + base64UrlEncode(task.urls[0] || '') + '&pause=true';

                    for (const key of Object.keys(task.options || {})) {
                        url += '&' + key + '=' + encodeURIComponent((task.options as Record<string, string>)[key]);
                    }

                    return url;
                })
                .join('\n');
        }

        const setting = options.data as AriaNgRpcSetting;
        let url =
            baseUrl +
            '#!/settings/rpc/set?protocol=' +
            setting.protocol +
            '&host=' +
            setting.rpcHost +
            '&port=' +
            setting.rpcPort +
            '&interface=' +
            setting.rpcInterface;

        if (setting.secret) {
            url += '&secret=' + base64UrlEncode(setting.secret);
        }

        return url;
    }, [options]);

    const copy = async () => {
        const success = await copyText(commandUrl);

        if (success) {
            setCopied(true);
        }
    };

    return (
        <Modal
            title={t('Export Command API')}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="rounded bg-gray-400 px-4 py-2 text-sm text-white" onClick={onClose}>
                        {t('Close')}
                    </button>
                    <button
                        type="button"
                        className="rounded bg-[#3c8dbc] px-4 py-2 text-sm text-white hover:bg-[#367fa9]"
                        onClick={() => void copy()}
                    >
                        {copied ? t('Data has been copied to clipboard.') : t('Copy')}
                    </button>
                </>
            }
        >
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-gray-900">
                {commandUrl}
            </pre>
        </Modal>
    );
}
