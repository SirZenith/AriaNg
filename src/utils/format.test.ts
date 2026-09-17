import { describe, expect, it } from 'vitest';
import { formatDuration, formatPercent, formatVolume, getTimeOption } from './format';

describe('formatVolume', () => {
    it('formats zero bytes', () => {
        expect(formatVolume(0)).toBe('0.00 B');
    });

    it('formats bytes and units', () => {
        expect(formatVolume(1024)).toBe('1.00 KB');
        expect(formatVolume(1024 * 1024)).toBe('1.00 MB');
        expect(formatVolume(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('accepts string values', () => {
        expect(formatVolume('2048')).toBe('2.00 KB');
    });

    it('supports auto fraction size', () => {
        expect(formatVolume(1536, 'auto')).toBe('1.5 KB');
        expect(formatVolume(1024 * 1024 * 10, 'auto')).toBe('10 MB');
    });
});

describe('formatPercent', () => {
    it('truncates to precision', () => {
        expect(formatPercent(33.3333, 2)).toBe('33.33');
        expect(formatPercent(99.999, 0)).toBe('99');
    });
});

describe('formatDuration', () => {
    it('formats seconds to HH:mm:ss', () => {
        expect(formatDuration(3661, 'HH:mm:ss')).toBe('01:01:01');
        expect(formatDuration(59, 'HH:mm:ss')).toBe('00:00:59');
    });
});

describe('getTimeOption', () => {
    it('picks the proper unit', () => {
        expect(getTimeOption(500).name).toBe('format.time.milliseconds');
        expect(getTimeOption(1000).name).toBe('format.time.second');
        expect(getTimeOption(60 * 1000).name).toBe('format.time.minute');
        expect(getTimeOption(2 * 60 * 1000).name).toBe('format.time.minutes');
        expect(getTimeOption(2 * 60 * 60 * 1000).name).toBe('format.time.hours');
    });
});
