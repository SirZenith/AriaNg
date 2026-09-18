import { describe, expect, it } from 'vitest';
import { decodePercentEncodedString, parseBittorrentClient, toDisplayablePeerId } from './peerId';

describe('decodePercentEncodedString', () => {
    it('decodes percent encoded peer ids', () => {
        expect(decodePercentEncodedString('%2DqB4500%2D')).toBe('-qB4500-');
    });

    it('keeps invalid percent sequences as is', () => {
        expect(decodePercentEncodedString('100%')).toBe('100%');
    });
});

describe('toDisplayablePeerId', () => {
    it('removes control characters after decoding', () => {
        expect(toDisplayablePeerId('%2DqB4500%2D%00%01')).toBe('-qB4500-');
    });
});

describe('parseBittorrentClient', () => {
    it('identifies qBittorrent with version', () => {
        expect(parseBittorrentClient('-qB4500-abcdefghijkl')).toEqual({ client: 'qBittorrent', version: '4.5.0' });
    });

    it('identifies Transmission', () => {
        expect(parseBittorrentClient('-TR4030-abcdefghijkl').client).toBe('Transmission');
    });

    it('identifies aria2', () => {
        expect(parseBittorrentClient('-aria2-abcdefghijkl')).toEqual({ client: 'Aria', version: '2' });
    });

    it('returns unknown for unrecognized peer ids', () => {
        expect(parseBittorrentClient('abcdefghijklmnopqrst').client).toBe('unknown');
    });
});
