import {
    File,
    FileArchive,
    FileCog,
    FileImage,
    FileMusic,
    FileText,
    FileVideoCamera,
    Folder,
    FolderOpen,
} from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Aria2File } from '@/types/aria2';
import { getFileType } from '@/utils/fileIcon';
import { formatPercent, formatVolume } from '@/utils/format';

function FileTypeIcon({ fileName }: { fileName: string }) {
    const className = 'h-4 w-4 shrink-0 text-gray-500';
    const type = getFileType(fileName);

    if (type === 'video') {
        return <FileVideoCamera className={className} aria-hidden="true" />;
    }

    if (type === 'audio') {
        return <FileMusic className={className} aria-hidden="true" />;
    }

    if (type === 'picture') {
        return <FileImage className={className} aria-hidden="true" />;
    }

    if (type === 'document') {
        return <FileText className={className} aria-hidden="true" />;
    }

    if (type === 'application') {
        return <FileCog className={className} aria-hidden="true" />;
    }

    if (type === 'archive') {
        return <FileArchive className={className} aria-hidden="true" />;
    }

    return <File className={className} aria-hidden="true" />;
}

function ProgressPie({ percent }: { percent: number }) {
    const value = Math.max(0, Math.min(100, percent));
    const label = formatPercent(value, 2) + '%';

    return (
        <span
            role="img"
            aria-label={label}
            title={label}
            className="relative inline-block h-4 w-4 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600"
        >
            <span
                className="absolute inset-0 rounded-full"
                style={{ background: `conic-gradient(var(--color-primary) ${value * 3.6}deg, transparent 0deg)` }}
            />
        </span>
    );
}

interface TaskFileRowProps {
    file: Aria2File;
    indent: number;
    isMultiDir: boolean;
    choosing: boolean;
    selected: boolean;
    collapsed: boolean;
    dirSelectedCount?: number;
    dirTotalCount?: number;
    onToggleCollapse: (file: Aria2File) => void;
    onToggleSelected: (file: Aria2File, checked: boolean) => void;
    onToggleDir: (file: Aria2File, checked: boolean) => void;
}

function TaskFileRow({
    file,
    indent,
    isMultiDir,
    choosing,
    selected,
    collapsed,
    dirSelectedCount,
    dirTotalCount,
    onToggleCollapse,
    onToggleSelected,
    onToggleDir,
}: TaskFileRowProps) {
    const { t } = useTranslation();
    const percent = Number(file.completePercent || 0);
    const showDirButton = isMultiDir && !choosing;
    const clickableDir = showDirButton && !!file.isDir;
    const selectedCount = dirSelectedCount || 0;
    const totalCount = dirTotalCount || 0;
    const allSelected = totalCount > 0 && selectedCount === totalCount;
    const progressBar = (
        <div className="h-2 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            <div className="h-full bg-primary" style={{ width: Math.min(100, percent) + '%' }} />
        </div>
    );

    return (
        <div
            className={
                '[content-visibility:auto] [contain-intrinsic-size:auto_33px] grid grid-cols-12 items-center gap-2 border-b border-gray-100 px-2 py-1.5 text-sm last:border-0 dark:border-gray-700' +
                (clickableDir ? ' cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900' : '')
            }
            onClick={clickableDir ? () => onToggleCollapse(file) : undefined}
        >
            <div
                className={
                    'flex min-w-0 items-center gap-2 ' +
                    (file.isDir ? 'col-span-9 sm:col-span-9' : 'col-span-8 sm:col-span-6')
                }
                style={{ paddingLeft: indent }}
            >
                {choosing && !file.isDir ? (
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => onToggleSelected(file, event.target.checked)}
                    />
                ) : choosing && file.isDir ? (
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(element) => {
                            if (element) {
                                element.indeterminate = selectedCount > 0 && !allSelected;
                            }
                        }}
                        onChange={(event) => onToggleDir(file, event.target.checked)}
                    />
                ) : clickableDir ? (
                    <button
                        type="button"
                        className="flex items-center text-gray-500"
                        aria-label={collapsed ? t('Expand') : t('Collapse')}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleCollapse(file);
                        }}
                    >
                        {collapsed ? (
                            <Folder className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <FolderOpen className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                ) : null}

                {!file.isDir ? (
                    <FileTypeIcon fileName={file.fileName || ''} />
                ) : file.isDir && !showDirButton ? (
                    collapsed ? (
                        <Folder className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                    ) : (
                        <FolderOpen className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                    )
                ) : null}

                <span className="truncate" title={file.path}>
                    {file.isDir ? file.nodeName : file.fileName || file.path}
                </span>
            </div>

            {!file.isDir ? (
                <>
                    <div className="order-1 col-span-1 flex items-center justify-end sm:hidden">
                        <ProgressPie percent={percent} />
                    </div>
                    <div className="hidden sm:order-2 sm:col-span-3 sm:block">
                        {progressBar}
                        <span className="text-xs">{formatPercent(percent, 2) + '%'}</span>
                    </div>
                </>
            ) : null}

            <div className="order-2 col-span-3 text-right text-xs sm:order-3 sm:col-span-3">
                {formatVolume(Number(file.length))}
            </div>
        </div>
    );
}

export default memo(TaskFileRow);
