import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ariaNgFileTypes } from '@/config/fileTypes';
import { aria2TaskService } from '@/services/taskService';
import type { Aria2File, Aria2Task } from '@/types/aria2';
import { getFileExtension } from '@/utils/common';
import { formatDuration, formatPercent, formatVolume } from '@/utils/format';

interface TaskFileListProps {
    task: Aria2Task;
    onChanged: () => void;
}

function isHiddenByCollapse(node: Aria2File, collapsed: Set<string>): boolean {
    const parentPath = node.relativePath || '';

    if (!parentPath) {
        return false;
    }

    const parts = parentPath.split('/');
    let current = '';

    for (const part of parts) {
        current = current ? current + '/' + part : part;

        if (collapsed.has(current)) {
            return true;
        }
    }

    return false;
}

function isUnderDir(file: Aria2File, dirPath: string): boolean {
    if (file.isDir) {
        return false;
    }

    const parentPath = file.relativePath || '';

    if (dirPath === '') {
        return true;
    }

    return parentPath === dirPath || parentPath.indexOf(dirPath + '/') === 0;
}

export default function TaskFileList({ task, onChanged }: TaskFileListProps) {
    const { t } = useTranslation();
    const [orderType, setOrderType] = useState('default:asc');
    const [choosing, setChoosing] = useState(false);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [customExtensions, setCustomExtensions] = useState('');

    const files = useMemo(() => task.files || [], [task.files]);
    const canChoose = files.length > 1 && (task.status === 'waiting' || task.status === 'paused');
    const isMultiDir = !!task.multiDir;

    const orderedFiles = useMemo(() => {
        if (isMultiDir) {
            return files;
        }

        const fileList = files.slice();

        if (orderType === 'name:asc' || orderType === 'name:desc') {
            fileList.sort((left, right) => (left.fileName || '').localeCompare(right.fileName || ''));
        } else if (orderType === 'size:asc' || orderType === 'size:desc') {
            fileList.sort((left, right) => Number(left.length) - Number(right.length));
        } else if (orderType === 'percent:asc' || orderType === 'percent:desc') {
            fileList.sort((left, right) => Number(left.completePercent) - Number(right.completePercent));
        }

        if (orderType.endsWith(':desc')) {
            fileList.reverse();
        }

        return fileList;
    }, [files, isMultiDir, orderType]);

    const startChoosing = () => {
        const next: Record<string, boolean> = {};

        for (const file of files) {
            if (!file.isDir) {
                next[String(file.index)] = !!file.selected;
            }
        }

        setSelected(next);
        setChoosing(true);
    };

    const cancelChoosing = () => {
        setChoosing(false);
    };

    const selectAll = (value: boolean) => {
        const next: Record<string, boolean> = {};

        for (const file of files) {
            if (!file.isDir) {
                next[String(file.index)] = value;
            }
        }

        setSelected(next);
    };

    const toggleDir = (dirNode: Aria2File, value: boolean) => {
        const targets = files.filter((file) => isUnderDir(file, dirNode.nodePath || ''));
        const next = { ...selected };

        for (const file of targets) {
            next[String(file.index)] = value;
        }

        setSelected(next);
    };

    const applyTypeSelection = (type: string) => {
        const extensions = ariaNgFileTypes[type]?.extensions || [];
        const targets = files.filter((file) => {
            if (file.isDir) {
                return false;
            }

            const extension = getFileExtension(file.fileName || '').toLowerCase();

            return extensions.indexOf(extension) >= 0;
        });

        if (targets.length < 1) {
            return;
        }

        const allSelected = targets.every((file) => selected[String(file.index)]);
        const next = { ...selected };

        for (const file of targets) {
            next[String(file.index)] = !allSelected;
        }

        setSelected(next);
    };

    const applyCustomExtensions = () => {
        const extensions = customExtensions
            .split(',')
            .map((item) => item.trim().toLowerCase())
            .filter((item) => item.length > 0)
            .map((item) => (item.charAt(0) === '.' ? item : '.' + item));

        if (extensions.length < 1) {
            return;
        }

        const targets = files.filter(
            (file) => !file.isDir && extensions.indexOf(getFileExtension(file.fileName || '').toLowerCase()) >= 0,
        );

        if (targets.length < 1) {
            return;
        }

        const allSelected = targets.every((file) => selected[String(file.index)]);
        const next = { ...selected };

        for (const file of targets) {
            next[String(file.index)] = !allSelected;
        }

        setSelected(next);
    };

    const saveChoosing = async () => {
        setSaving(true);

        try {
            const indexes = files
                .filter((file) => !file.isDir && selected[String(file.index)])
                .map((file) => file.index);
            await aria2TaskService.selectTaskFile(task.gid, indexes);
            setChoosing(false);
            onChanged();
        } finally {
            setSaving(false);
        }
    };

    const renderDirCheckbox = (file: Aria2File) => {
        const targets = files.filter((item) => isUnderDir(item, file.nodePath || ''));
        const selectedCount = targets.filter((item) => selected[String(item.index)]).length;
        const allSelected = targets.length > 0 && selectedCount === targets.length;

        return (
            <input
                type="checkbox"
                checked={allSelected}
                ref={(element) => {
                    if (element) {
                        element.indeterminate = selectedCount > 0 && !allSelected;
                    }
                }}
                onChange={(event) => toggleDir(file, event.target.checked)}
            />
        );
    };

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{t('File Name')}</span>

                {!isMultiDir ? (
                    <select
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                        value={orderType}
                        onChange={(event) => setOrderType(event.target.value)}
                    >
                        <option value="default:asc">{t('Default')}</option>
                        <option value="name:asc">{t('By File Name')}</option>
                        <option value="percent:desc">{t('By Progress')}</option>
                        <option value="size:asc">{t('By File Size')}</option>
                    </select>
                ) : null}

                {canChoose && !choosing ? (
                    <button
                        type="button"
                        className="ml-auto text-sm text-blue-600 hover:underline"
                        onClick={startChoosing}
                    >
                        {t('(Choose Files)')}
                    </button>
                ) : null}

                {choosing ? (
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            className="text-sm text-blue-600 hover:underline"
                            onClick={() => selectAll(true)}
                        >
                            {t('Select All')}
                        </button>
                        <button
                            type="button"
                            className="text-sm text-blue-600 hover:underline"
                            onClick={() => selectAll(false)}
                        >
                            {t('Select None')}
                        </button>
                        <select
                            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                            value=""
                            onChange={(event) => applyTypeSelection(event.target.value)}
                        >
                            <option value="">{t('Select Files by Type')}</option>
                            {Object.keys(ariaNgFileTypes).map((type) => (
                                <option key={type} value={type}>
                                    {t(ariaNgFileTypes[type].name)}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            className="w-40 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                            placeholder=".mkv,.mp4"
                            value={customExtensions}
                            onChange={(event) => setCustomExtensions(event.target.value)}
                        />
                        <button
                            type="button"
                            className="rounded bg-gray-500 px-2 py-1 text-sm text-white"
                            onClick={applyCustomExtensions}
                        >
                            {t('Apply')}
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            className="rounded bg-[#3c8dbc] px-3 py-1 text-sm text-white disabled:opacity-50"
                            onClick={() => void saveChoosing()}
                        >
                            {t('Save')}
                        </button>
                        <button
                            type="button"
                            className="rounded bg-gray-400 px-3 py-1 text-sm text-white"
                            onClick={cancelChoosing}
                        >
                            {t('Cancel')}
                        </button>
                    </div>
                ) : null}
            </div>

            <div className="rounded border border-gray-200 dark:border-gray-700">
                <div className="hidden grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold sm:grid dark:border-gray-700 dark:bg-gray-900">
                    <div className="col-span-6">{t('File Name')}</div>
                    <div className="col-span-3">{t('Progress')}</div>
                    <div className="col-span-3 text-right">{t('File Size')}</div>
                </div>

                {orderedFiles.map((file) => {
                    if (isMultiDir && isHiddenByCollapse(file, collapsed)) {
                        return null;
                    }

                    const percent = Number(file.completePercent || 0);
                    const isSelected = file.isDir ? false : choosing ? !!selected[String(file.index)] : !!file.selected;
                    const indent = isMultiDir ? Number(file.level || 0) * 16 : 0;

                    return (
                        <div
                            key={(file.isDir ? 'dir-' : 'file-') + String(file.nodePath || '') + String(file.index)}
                            className="grid grid-cols-12 items-center gap-2 border-b border-gray-100 px-2 py-1.5 text-sm last:border-0 dark:border-gray-700"
                        >
                            <div
                                className="col-span-12 flex min-w-0 items-center gap-2 sm:col-span-6"
                                style={{ paddingLeft: indent }}
                            >
                                {choosing && !file.isDir ? (
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(event) =>
                                            setSelected((current) => ({
                                                ...current,
                                                [String(file.index)]: event.target.checked,
                                            }))
                                        }
                                    />
                                ) : choosing && file.isDir ? (
                                    renderDirCheckbox(file)
                                ) : isMultiDir && file.isDir ? (
                                    <button
                                        type="button"
                                        className="w-4 text-gray-500"
                                        onClick={() => {
                                            const nodePath = file.nodePath || '';
                                            const next = new Set(collapsed);

                                            if (next.has(nodePath)) {
                                                next.delete(nodePath);
                                            } else {
                                                next.add(nodePath);
                                            }

                                            setCollapsed(next);
                                        }}
                                    >
                                        {collapsed.has(file.nodePath || '') ? '&#9654;' : '&#9660;'}
                                    </button>
                                ) : (
                                    <span className={file.selected ? 'text-[#3c8dbc]' : 'text-gray-400'}>&#9679;</span>
                                )}
                                <span className="truncate" title={file.path}>
                                    {file.isDir ? file.nodeName : file.fileName || file.path}
                                </span>
                            </div>
                            <div className="col-span-8 sm:col-span-3">
                                {!file.isDir ? (
                                    <>
                                        <div className="h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className="h-full bg-[#3c8dbc]"
                                                style={{ width: Math.min(100, percent) + '%' }}
                                            />
                                        </div>
                                        <span className="text-xs">{formatPercent(percent, 2) + '%'}</span>
                                    </>
                                ) : null}
                            </div>
                            <div className="col-span-4 text-right text-xs sm:col-span-3">
                                {formatVolume(Number(file.length))}
                            </div>
                        </div>
                    );
                })}

                {orderedFiles.length < 1 ? (
                    <div className="p-4 text-center text-sm text-gray-500">{t('There is no file')}</div>
                ) : null}
            </div>

            {task.status === 'active' ? (
                <div className="mt-2 text-xs text-gray-500">
                    {formatDuration(Number(task.remainTime || 0), 'HH:mm:ss')}
                </div>
            ) : null}
        </div>
    );
}
