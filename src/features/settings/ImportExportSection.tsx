import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyInPage } from '@/services/notification';
import { aria2SettingService } from '@/services/aria2SettingService';
import { exportAllOptions, importAllOptions } from '@/services/settingService';
import { downloadFile, readFileAsText } from '@/utils/file';
import { copyText } from '@/utils/clipboard';

export default function ImportExportSection() {
    const { t } = useTranslation();
    const [importText, setImportText] = useState('');
    const [exportText, setExportText] = useState('');
    const [showExport, setShowExport] = useState(false);

    const exportSettings = () => {
        setExportText(JSON.stringify(exportAllOptions(), null, 4));
        setShowExport(true);
    };

    const copyExport = async () => {
        if (await copyText(exportText)) {
            notifyInPage('', t('Data has been copied to clipboard.'), { type: 'success' });
        }
    };

    const downloadExport = () => {
        downloadFile(exportText, 'AriaNg-Settings.json', 'application/json');
    };

    const openImportFile = async (file: File | undefined) => {
        if (!file) {
            return;
        }

        try {
            setImportText(await readFileAsText(file));
        } catch {
            notifyInPage('Error', t('Failed to load file!'), { type: 'error' });
        }
    };

    const applyImport = () => {
        let settings: unknown;

        try {
            settings = JSON.parse(importText);
        } catch {
            notifyInPage('Error', t('Invalid settings data format!'), { type: 'error' });
            return;
        }

        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
            notifyInPage('Error', t('Invalid settings data format!'), { type: 'error' });
            return;
        }

        if (!window.confirm(t('Are you sure you want to import all settings?'))) {
            return;
        }

        importAllOptions(settings as Record<string, never>);
        window.location.reload();
    };

    const clearHistory = () => {
        if (!window.confirm(t('Are you sure you want to clear all settings history?'))) {
            return;
        }

        aria2SettingService.clearSettingsHistorys();
        notifyInPage('', t('Operation Succeeded'), { type: 'success' });
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    className="rounded bg-[#3c8dbc] px-3 py-1.5 text-sm text-white"
                    onClick={exportSettings}
                >
                    {t('Export Settings')}
                </button>
                <label className="cursor-pointer rounded bg-green-600 px-3 py-1.5 text-sm text-white">
                    {t('Import Settings')}
                    <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(event) => void openImportFile(event.target.files?.[0])}
                    />
                </label>
                <button
                    type="button"
                    className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white"
                    onClick={clearHistory}
                >
                    {t('Clear Settings History')}
                </button>
            </div>

            <div className="mt-3">
                <textarea
                    className="h-32 w-full rounded border border-gray-300 bg-white px-2 py-1 font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
                    placeholder={t('Import Settings')}
                    value={importText}
                    onChange={(event) => setImportText(event.target.value)}
                />
                <button
                    type="button"
                    disabled={!importText}
                    className="mt-1 rounded bg-[#3c8dbc] px-3 py-1.5 text-sm text-white disabled:opacity-40"
                    onClick={applyImport}
                >
                    {t('Import')}
                </button>
            </div>

            {showExport ? (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4"
                    onClick={() => setShowExport(false)}
                >
                    <div
                        className="mt-16 w-full max-w-2xl rounded bg-white p-4 dark:bg-gray-800"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h3 className="mb-2 font-semibold">{t('Export Settings')}</h3>
                        <textarea
                            readOnly
                            className="h-64 w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 font-mono text-xs dark:border-gray-600 dark:bg-gray-900"
                            value={exportText}
                        />
                        <div className="mt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded bg-gray-400 px-3 py-1.5 text-sm text-white"
                                onClick={() => setShowExport(false)}
                            >
                                {t('Close')}
                            </button>
                            <button
                                type="button"
                                className="rounded bg-gray-500 px-3 py-1.5 text-sm text-white"
                                onClick={downloadExport}
                            >
                                {t('Download')}
                            </button>
                            <button
                                type="button"
                                className="rounded bg-[#3c8dbc] px-3 py-1.5 text-sm text-white"
                                onClick={() => void copyExport()}
                            >
                                {t('Copy')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
