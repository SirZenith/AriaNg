import { ariaNgConstants } from '@/config/constants';

export function base64Encode(value: string): string {
    return btoa(unescape(encodeURIComponent(value)));
}

export function base64Decode(value: string): string {
    return decodeURIComponent(escape(atob(value)));
}

export function base64UrlEncode(value: string): string {
    return base64Encode(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(value: string): string {
    let base64 = value.replace(/-/g, '+').replace(/_/g, '/');

    while (base64.length % 4 !== 0) {
        base64 += '=';
    }

    return base64Decode(base64);
}

export function generateUniqueId(): string {
    const sourceId = ariaNgConstants.appPrefix + '_' + Math.round(Date.now() / 1000) + '_' + Math.random();

    return base64Encode(sourceId);
}

export function decodePercentEncodedString(value: string): string {
    if (!value) {
        return value;
    }

    let result = '';

    for (let i = 0; i < value.length; i++) {
        const char = value.charAt(i);

        if (char === '%' && i < value.length - 2) {
            result += String.fromCharCode(parseInt(value.substring(i + 1, i + 3), 16));
            i += 2;
        } else {
            result += char;
        }
    }

    return result;
}

export function getFileExtension(filePath: string): string {
    if (!filePath || filePath.lastIndexOf('.') < 0) {
        return filePath;
    }

    return filePath.substring(filePath.lastIndexOf('.'));
}

export function parseUrlsFromOriginInput(input: string): string[] {
    if (!input) {
        return [];
    }

    const lines = input.split('\n');
    const result: string[] = [];

    for (const line of lines) {
        if (/^(http|https|ftp|sftp):\/\/.+$/.test(line) || /^magnet:\?.+$/.test(line)) {
            result.push(line);
        }
    }

    return result;
}

export function countArray<T>(array: T[], value: T): number {
    if (!Array.isArray(array) || array.length < 1) {
        return 0;
    }

    let count = 0;

    for (const item of array) {
        count += item === value ? 1 : 0;
    }

    return count;
}

export function pushArrayTo<T>(array: T[], items: T[]): T[] {
    if (!Array.isArray(array)) {
        array = [];
    }

    if (!Array.isArray(items) || items.length < 1) {
        return array;
    }

    for (const item of items) {
        array.push(item);
    }

    return array;
}

export function extendArray<T extends Record<string, unknown>>(
    sourceArray: T[],
    targetArray: T[],
    keyProperty: string,
): boolean {
    if (!targetArray || !sourceArray || sourceArray.length !== targetArray.length) {
        return false;
    }

    for (let i = 0; i < targetArray.length; i++) {
        if (targetArray[i][keyProperty] === sourceArray[i][keyProperty]) {
            Object.assign(targetArray[i], sourceArray[i]);
        } else {
            return false;
        }
    }

    return true;
}

export interface OrderType {
    type: string;
    order: string;
    reverse: boolean;
    equals(other: { type: string; order?: string }): boolean;
    getValue(): string;
}

export function parseOrderType(value: string): OrderType {
    const values = value.split(':');
    const obj = {
        type: values[0],
        order: values[1],
    } as OrderType;

    obj.equals = function (other: { type: string; order?: string }): boolean {
        if (other.order === undefined) {
            return this.type === other.type;
        }

        return this.type === other.type && this.order === other.order;
    };

    obj.getValue = function (): string {
        return this.type + ':' + this.order;
    };

    Object.defineProperty(obj, 'reverse', {
        get: function () {
            return this.order === 'desc';
        },
        set: function (value: boolean) {
            this.order = value ? 'desc' : 'asc';
        },
    });

    return obj;
}

function compareValues(left: unknown, right: unknown): number {
    if (left === right) {
        return 0;
    }

    if (left === undefined || left === null) {
        return 1;
    }

    if (right === undefined || right === null) {
        return -1;
    }

    if (typeof left === 'number' && typeof right === 'number') {
        return left - right;
    }

    const leftString = String(left);
    const rightString = String(right);

    if (leftString < rightString) {
        return -1;
    }

    if (leftString > rightString) {
        return 1;
    }

    return 0;
}

export function orderByArray<T extends Record<string, unknown>>(array: T[], keys: string[], reverse: boolean): T[] {
    const result = array.slice();

    result.sort((left, right) => {
        for (const key of keys) {
            const compared = compareValues(left[key], right[key]);

            if (compared !== 0) {
                return reverse ? -compared : compared;
            }
        }

        return 0;
    });

    return result;
}
