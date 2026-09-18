import { File, FileArchive, FileCog, FileImage, FileMusic, FileText, FileVideoCamera } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { getFileTypeIcon } from './fileIcon';

describe('getFileTypeIcon', () => {
    it('maps video extensions to the video icon', () => {
        expect(getFileTypeIcon('movie.mkv')).toBe(FileVideoCamera);
        expect(getFileTypeIcon('clip.MP4')).toBe(FileVideoCamera);
    });

    it('maps audio extensions to the audio icon', () => {
        expect(getFileTypeIcon('song.flac')).toBe(FileMusic);
    });

    it('maps picture extensions to the image icon', () => {
        expect(getFileTypeIcon('photo.png')).toBe(FileImage);
    });

    it('maps document extensions to the text icon', () => {
        expect(getFileTypeIcon('manual.pdf')).toBe(FileText);
    });

    it('maps application extensions to the cog icon', () => {
        expect(getFileTypeIcon('setup.exe')).toBe(FileCog);
    });

    it('maps archive extensions to the archive icon', () => {
        expect(getFileTypeIcon('bundle.zip')).toBe(FileArchive);
    });

    it('falls back to the generic file icon', () => {
        expect(getFileTypeIcon('unknown.xyz')).toBe(File);
        expect(getFileTypeIcon('no-extension')).toBe(File);
        expect(getFileTypeIcon('')).toBe(File);
    });
});
