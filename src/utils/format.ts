export interface TimeOption {
    name: string;
    value: number;
    optionValue: number;
}

export function formatNumber(value: number, fractionSize: number): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '';
    }

    return value.toLocaleString('en-US', {
        minimumFractionDigits: fractionSize,
        maximumFractionDigits: fractionSize,
    });
}

const volumeUnits = ['B', 'KB', 'MB', 'GB'];

function getAutoFractionSize(value: number): number {
    if (value < 1) {
        return 2;
    } else if (value < 10) {
        return 1;
    }

    return 0;
}

export function formatVolume(value: number | string, fractionSize: number | 'auto' = 2): string {
    let actualValue = typeof value === 'number' ? value : parseInt(value as string);
    let unit = volumeUnits[0];
    let actualFractionSize = 2;
    const autoFractionSize = fractionSize === 'auto';

    if (typeof fractionSize === 'number') {
        actualFractionSize = fractionSize;
    }

    if (!actualValue || Number.isNaN(actualValue)) {
        actualValue = 0;
    }

    for (let i = 1; i < volumeUnits.length; i++) {
        if (actualValue >= 1024) {
            actualValue = actualValue / 1024;
            unit = volumeUnits[i];
        } else {
            break;
        }
    }

    if (autoFractionSize) {
        actualFractionSize = getAutoFractionSize(actualValue);
    }

    return formatNumber(actualValue, actualFractionSize) + ' ' + unit;
}

export function formatPercent(value: number, precision: number): string {
    const ratio = Math.pow(10, precision);
    const result = Math.floor(value * ratio) / ratio;

    return formatNumber(result, precision);
}

export function formatDateTime(datetime: Date | number | string, format: string): string {
    const date = datetime instanceof Date ? datetime : new Date(datetime);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (value: number, length = 2) => String(value).padStart(length, '0');
    const replacements: Record<string, string> = {
        YYYY: String(date.getFullYear()),
        MM: pad(date.getMonth() + 1),
        DD: pad(date.getDate()),
        HH: pad(date.getHours()),
        mm: pad(date.getMinutes()),
        ss: pad(date.getSeconds()),
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => replacements[match]);
}

export function formatLongDate(time: number, format: string): string {
    return formatDateTime(new Date(time), format);
}

export function formatDuration(durationSeconds: number, format: string): string {
    const totalSeconds = Math.max(0, Math.floor(durationSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => String(value).padStart(2, '0');

    return format.replace(/HH/g, pad(hours)).replace(/mm/g, pad(minutes)).replace(/ss/g, pad(seconds));
}

export function getTimeOption(time: number): TimeOption {
    let name = '';
    let value = time;

    if (time < 1000) {
        value = time;
        name = value === 1 ? 'format.time.millisecond' : 'format.time.milliseconds';
    } else if (time < 1000 * 60) {
        value = time / 1000;
        name = value === 1 ? 'format.time.second' : 'format.time.seconds';
    } else if (time < 1000 * 60 * 24) {
        value = time / 1000 / 60;
        name = value === 1 ? 'format.time.minute' : 'format.time.minutes';
    } else {
        value = time / 1000 / 60 / 24;
        name = value === 1 ? 'format.time.hour' : 'format.time.hours';
    }

    return {
        name,
        value,
        optionValue: time,
    };
}

export function getTimeOptions(timeList: number[], withDisabled: boolean): TimeOption[] {
    const options: TimeOption[] = [];

    if (withDisabled) {
        options.push({
            name: 'Disabled',
            value: 0,
            optionValue: 0,
        });
    }

    if (!Array.isArray(timeList) || timeList.length < 1) {
        return options;
    }

    for (const time of timeList) {
        options.push(getTimeOption(time));
    }

    return options;
}
