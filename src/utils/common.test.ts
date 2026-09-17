import { describe, expect, it } from 'vitest';
import {
    base64Decode,
    base64Encode,
    base64UrlDecode,
    base64UrlEncode,
    countArray,
    getFileExtension,
    parseOrderType,
    parseUrlsFromOriginInput,
    orderByArray
} from './common';

describe('base64', () => {
    it('encodes and decodes utf8 text', () => {
        const text = 'AriaNg 下载 https://example.org';
        expect(base64Decode(base64Encode(text))).toBe(text);
    });

    it('encodes and decodes url safe variants', () => {
        const text = 'a+b/c==?';
        expect(base64UrlDecode(base64UrlEncode(text))).toBe(text);
        expect(base64UrlEncode(text)).not.toContain('+');
        expect(base64UrlEncode(text)).not.toContain('/');
    });
});

describe('parseUrlsFromOriginInput', () => {
    it('filters invalid lines', () => {
        const input = 'http://example.org/a\ninvalid\nmagnet:?xt=urn:btih:abc\nhttps://example.org/b';
        expect(parseUrlsFromOriginInput(input)).toEqual([
            'http://example.org/a',
            'magnet:?xt=urn:btih:abc',
            'https://example.org/b'
        ]);
    });
});

describe('parseOrderType', () => {
    it('parses type and order', () => {
        const order = parseOrderType('percent:desc');

        expect(order.type).toBe('percent');
        expect(order.order).toBe('desc');
        expect(order.reverse).toBe(true);
        expect(order.getValue()).toBe('percent:desc');
        expect(order.equals({ type: 'percent' })).toBe(true);
    });

    it('supports reverse setter', () => {
        const order = parseOrderType('name:asc');
        expect(order.reverse).toBe(false);

        order.reverse = true;
        expect(order.order).toBe('desc');
    });
});

describe('orderByArray', () => {
    const items = [
        { name: 'b', size: 2 },
        { name: 'a', size: 3 },
        { name: 'c', size: 1 }
    ];

    it('sorts ascending by key', () => {
        expect(orderByArray(items, ['name'], false).map((item) => item.name)).toEqual(['a', 'b', 'c']);
    });

    it('sorts descending by key', () => {
        expect(orderByArray(items, ['size'], true).map((item) => item.size)).toEqual([3, 2, 1]);
    });
});

describe('misc', () => {
    it('gets file extension', () => {
        expect(getFileExtension('/tmp/a.tar.gz')).toBe('.gz');
        expect(getFileExtension('filename')).toBe('filename');
    });

    it('counts array items', () => {
        expect(countArray([true, false, true, true], true)).toBe(3);
    });
});
