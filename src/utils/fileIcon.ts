import {
    File,
    FileArchive,
    FileCog,
    FileImage,
    FileMusic,
    FileText,
    FileVideoCamera,
    type LucideIcon,
} from 'lucide-react';
import { ariaNgFileTypes } from '@/config/fileTypes';
import { getFileExtension } from '@/utils/common';

const typeIcons: Record<string, LucideIcon> = {
    video: FileVideoCamera,
    audio: FileMusic,
    picture: FileImage,
    document: FileText,
    application: FileCog,
    archive: FileArchive,
};

export function getFileType(fileName: string): string | null {
    const extension = getFileExtension(fileName || '').toLowerCase();

    if (extension) {
        for (const [type, fileType] of Object.entries(ariaNgFileTypes)) {
            if (fileType.extensions.indexOf(extension) >= 0) {
                return type;
            }
        }
    }

    return null;
}

export function getFileTypeIcon(fileName: string): LucideIcon {
    const type = getFileType(fileName);

    return (type ? typeIcons[type] : null) || File;
}
