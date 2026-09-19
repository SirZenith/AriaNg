import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Eraser, FileDown, FileUp, RotateCcw } from 'lucide-react';
import { notifyInPage } from '@/services/notification';
import { aria2SettingService } from '@/services/aria2SettingService';
import { exportAllOptions, importAllOptions } from '@/services/settingService';
import { downloadFile, readFileAsText } from '@/utils/file';
import { copyText } from '@/utils/clipboard';
import BottomBarButton from '@/components/BottomBarButton';
import SplitBottomBar from '@/components/SplitBottomBar';

interface ImportExportSectionProps {
    onReset: () => void;
}

export default function ImportExportSection({ onReset }: ImportExportSectionProps) {
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
            <textarea
                className="h-32 w-full rounded border border-gray-300 bg-white px-2 py-1 font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
                placeholder={t('Import Settings')}
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
            />

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
                            <button type="button" className="btn btn-muted btn-sm" onClick={() => setShowExport(false)}>
                                {t('Close')}
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={downloadExport}>
                                {t('Download')}
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => void copyExport()}>
                                {t('Copy')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <SplitBottomBar
                leading={
                    <>
                        <BottomBarButton
                            ariaLabel={t('Export Settings')}
                            label={t('Export Settings')}
                            icon={FileUp}
                            iconClassName="text-green-600 dark:text-green-500"
                            onClick={exportSettings}
                        />
                        <BottomBarButton
                            ariaLabel={t('Import Settings')}
                            label={t('Import Settings')}
                            icon={FileDown}
                            iconClassName="text-primary dark:text-primary-light"
                        >
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={(event) => void openImportFile(event.target.files?.[0])}
                            />
                        </BottomBarButton>
                        <BottomBarButton
                            ariaLabel={t('Import')}
                            label={t('Import')}
                            icon={Check}
                            iconClassName="text-primary dark:text-primary-light"
                            disabled={!importText}
                            onClick={applyImport}
                        />
                        <BottomBarButton
                            ariaLabel={t('Clear Settings History')}
                            label={t('Clear Settings History')}
                            icon={Eraser}
                            iconClassName="text-amber-600 dark:text-amber-400"
                            onClick={clearHistory}
                        />
                    </>
                }
                trailing={
                    <BottomBarButton
                        ariaLabel={t('Reset Settings')}
                        label={t('Reset Settings')}
                        icon={RotateCcw}
                        iconClassName="text-red-600 dark:text-red-400"
                        onClick={onReset}
                    />
                }
            />
        </div>
    );
}
