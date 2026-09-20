import {
    ArrowLeftRight,
    Check,
    CheckSquare,
    ChevronsDown,
    ChevronsUp,
    ListChecks,
    SlidersHorizontal,
    Square,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomBarButton from '@/components/BottomBarButton';
import CenteredBottomBar from '@/components/CenteredBottomBar';
import TopBar from '@/components/TopBar';
import { ariaNgFileTypes } from '@/config/fileTypes';
import { aria2TaskService } from '@/services/taskService';
import type { Aria2File, Aria2Task } from '@/types/aria2';
import { getFileExtension } from '@/utils/common';
import { formatDuration } from '@/utils/format';
import TaskFileRow from './TaskFileRow';

interface FileToolbarButtonProps {
    label: string;
    icon: LucideIcon;
    iconClassName?: string;
    className?: string;
    ariaExpanded?: boolean;
    onClick: () => void;
}

function FileToolbarButton({
    label,
    icon: Icon,
    iconClassName,
    className,
    ariaExpanded,
    onClick,
}: FileToolbarButtonProps) {
    return (
        <button
            type="button"
            className={'btn btn-outline btn-sm' + (className ? ' ' + className : '')}
            title={label}
            aria-label={label}
            aria-expanded={ariaExpanded}
            onClick={onClick}
        >
            <Icon className={'h-4 w-4 shrink-0' + (iconClassName ? ' ' + iconClassName : '')} aria-hidden="true" />
            <span className="hidden md:inline">{label}</span>
        </button>
    );
}

interface TaskFileListProps {
    task: Aria2Task;
    onChanged: () => void;
    onChoosingChange?: (choosing: boolean) => void;
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

export default function TaskFileList({ task, onChanged, onChoosingChange }: TaskFileListProps) {
    const { t } = useTranslation();
    const [orderType, setOrderType] = useState('default:asc');
    const [choosing, setChoosing] = useState(false);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [collapsedState, setCollapsedState] = useState<Set<string> | null>(null);
    const [saving, setSaving] = useState(false);
    const [customExtensions, setCustomExtensions] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);

    const files = useMemo(() => task.files || [], [task.files]);
    const canChoose = files.length > 1 && (task.status === 'waiting' || task.status === 'paused');
    const isMultiDir = !!task.multiDir;
    const totalFileCount = useMemo(() => files.filter((file) => !file.isDir).length, [files]);
    const selectedFileCount = useMemo(
        () =>
            files.filter((file) => !file.isDir && (choosing ? !!selected[String(file.index)] : !!file.selected)).length,
        [files, choosing, selected],
    );

    useEffect(() => {
        return () => onChoosingChange?.(false);
    }, [onChoosingChange]);

    const defaultCollapsed = useMemo(
        () => new Set(files.filter((file) => file.isDir).map((file) => file.nodePath || '')),
        [files],
    );
    const collapsed = collapsedState ?? defaultCollapsed;

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
        setFilterVisible(false);
        setChoosing(true);
        onChoosingChange?.(true);
    };

    const cancelChoosing = () => {
        setChoosing(false);
        onChoosingChange?.(false);
    };

    const expandAll = () => {
        setCollapsedState(new Set());
    };

    const collapseAll = () => {
        setCollapsedState(defaultCollapsed);
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

    const invertSelection = () => {
        setSelected((current) => {
            const next = { ...current };

            for (const file of files) {
                if (!file.isDir) {
                    next[String(file.index)] = !next[String(file.index)];
                }
            }

            return next;
        });
    };

    const toggleCollapse = useCallback(
        (file: Aria2File) => {
            setCollapsedState((current) => {
                const nodePath = file.nodePath || '';
                const next = new Set(current ?? defaultCollapsed);

                if (next.has(nodePath)) {
                    next.delete(nodePath);
                } else {
                    next.add(nodePath);
                }

                return next;
            });
        },
        [defaultCollapsed],
    );

    const toggleSelected = useCallback((file: Aria2File, checked: boolean) => {
        setSelected((current) => ({ ...current, [String(file.index)]: checked }));
    }, []);

    const toggleDir = useCallback(
        (dirNode: Aria2File, value: boolean) => {
            setSelected((current) => {
                const next = { ...current };

                for (const file of files) {
                    if (!isUnderDir(file, dirNode.nodePath || '')) {
                        continue;
                    }

                    next[String(file.index)] = value;
                }

                return next;
            });
        },
        [files],
    );

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
        const indexes = files.filter((file) => !file.isDir && selected[String(file.index)]).map((file) => file.index);

        if (indexes.length < 1) {
            return;
        }

        setSaving(true);

        try {
            await aria2TaskService.selectTaskFile(task.gid, indexes);
            setChoosing(false);
            onChoosingChange?.(false);
            onChanged();
        } finally {
            setSaving(false);
        }
    };

    const visibleFiles = useMemo(() => {
        if (!isMultiDir) {
            return orderedFiles;
        }

        return orderedFiles.filter((file) => !isHiddenByCollapse(file, collapsed));
    }, [orderedFiles, isMultiDir, collapsed]);

    const dirSelections = useMemo(() => {
        if (!choosing) {
            return null;
        }

        const result = new Map<string, { selectedCount: number; totalCount: number }>();

        for (const file of files) {
            if (file.isDir) {
                result.set(file.nodePath || '', { selectedCount: 0, totalCount: 0 });
            }
        }

        for (const file of files) {
            if (file.isDir) {
                continue;
            }

            const isSelected = !!selected[String(file.index)];
            const parentPath = file.relativePath || '';
            const candidates = [''];
            let current = '';

            for (const part of parentPath.split('/')) {
                if (!part) {
                    continue;
                }

                current = current ? current + '/' + part : part;
                candidates.push(current);
            }

            for (const path of candidates) {
                const entry = result.get(path);

                if (entry) {
                    entry.totalCount += 1;

                    if (isSelected) {
                        entry.selectedCount += 1;
                    }
                }
            }
        }

        return result;
    }, [choosing, files, selected]);

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{t('File Name')}</span>

                {isMultiDir ? (
                    <>
                        <FileToolbarButton
                            label={t('Expand All')}
                            icon={ChevronsDown}
                            iconClassName="text-primary dark:text-primary-light"
                            onClick={expandAll}
                        />
                        <FileToolbarButton
                            label={t('Collapse All')}
                            icon={ChevronsUp}
                            iconClassName="text-primary dark:text-primary-light"
                            onClick={collapseAll}
                        />
                    </>
                ) : (
                    <select
                        className="input w-auto"
                        value={orderType}
                        onChange={(event) => setOrderType(event.target.value)}
                    >
                        <option value="default:asc">{t('Default')}</option>
                        <option value="name:asc">{t('By File Name')}</option>
                        <option value="percent:desc">{t('By Progress')}</option>
                        <option value="size:asc">{t('By File Size')}</option>
                    </select>
                )}

                {canChoose && !choosing ? (
                    <FileToolbarButton
                        className="ml-auto"
                        label={t('(Choose Files)')}
                        icon={ListChecks}
                        iconClassName="text-primary dark:text-primary-light"
                        onClick={startChoosing}
                    />
                ) : null}

                {choosing ? (
                    <span className="ml-auto text-xs text-gray-500 tabular-nums dark:text-gray-400">
                        {selectedFileCount} / {totalFileCount}
                    </span>
                ) : null}
            </div>

            {choosing ? (
                <TopBar>
                    <div className="mx-auto mt-2 w-full max-w-250">
                        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/10">
                            <FileToolbarButton
                                label={t('Select All')}
                                icon={CheckSquare}
                                iconClassName="text-green-600 dark:text-green-500"
                                onClick={() => selectAll(true)}
                            />
                            <FileToolbarButton
                                label={t('Select None')}
                                icon={Square}
                                iconClassName="text-gray-500 dark:text-gray-400"
                                onClick={() => selectAll(false)}
                            />
                            <FileToolbarButton
                                label={t('Select Invert')}
                                icon={ArrowLeftRight}
                                iconClassName="text-amber-600 dark:text-amber-400"
                                onClick={invertSelection}
                            />

                            <FileToolbarButton
                                className="ml-auto sm:hidden"
                                label={t('Filter')}
                                icon={SlidersHorizontal}
                                iconClassName="text-primary dark:text-primary-light"
                                ariaExpanded={filterVisible}
                                onClick={() => setFilterVisible((value) => !value)}
                            />

                            <div
                                className={
                                    (filterVisible ? 'flex' : 'hidden') +
                                    ' w-full flex-wrap items-center gap-2 sm:flex sm:w-auto sm:flex-1'
                                }
                            >
                                <select
                                    className="input w-auto"
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
                                    className="input min-w-0 flex-1 sm:max-w-48"
                                    placeholder=".mkv,.mp4"
                                    value={customExtensions}
                                    onChange={(event) => setCustomExtensions(event.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={applyCustomExtensions}
                                >
                                    {t('Apply')}
                                </button>
                            </div>
                        </div>
                    </div>
                </TopBar>
            ) : null}

            <div className="rounded border border-gray-200 dark:border-gray-700">
                <div className="hidden grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold sm:grid dark:border-gray-700 dark:bg-gray-900">
                    <div className="col-span-6">{t('File Name')}</div>
                    <div className="col-span-3">{t('Progress')}</div>
                    <div className="col-span-3 text-right">{t('File Size')}</div>
                </div>

                {visibleFiles.map((file) => {
                    const isSelected = file.isDir ? false : choosing ? !!selected[String(file.index)] : !!file.selected;
                    const dirSelection =
                        file.isDir && dirSelections ? dirSelections.get(file.nodePath || '') : undefined;

                    return (
                        <TaskFileRow
                            key={(file.isDir ? 'dir-' : 'file-') + String(file.nodePath || '') + String(file.index)}
                            file={file}
                            indent={isMultiDir ? Math.max(0, Number(file.level || 0) - 1) * 16 : 0}
                            isMultiDir={isMultiDir}
                            choosing={choosing}
                            selected={isSelected}
                            collapsed={collapsed.has(file.nodePath || '')}
                            dirSelectedCount={dirSelection?.selectedCount}
                            dirTotalCount={dirSelection?.totalCount}
                            onToggleCollapse={toggleCollapse}
                            onToggleSelected={toggleSelected}
                            onToggleDir={toggleDir}
                        />
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

            {choosing ? (
                <CenteredBottomBar>
                    <BottomBarButton
                        ariaLabel={t('Cancel')}
                        label={t('Cancel')}
                        icon={X}
                        hideLabelOnMobile={false}
                        onClick={cancelChoosing}
                    />
                    <BottomBarButton
                        ariaLabel={t('Save')}
                        label={t('Save')}
                        icon={Check}
                        hideLabelOnMobile={false}
                        disabled={saving || selectedFileCount < 1}
                        onClick={() => void saveChoosing()}
                    />
                </CenteredBottomBar>
            ) : null}
        </div>
    );
}
