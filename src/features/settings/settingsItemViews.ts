import type { TFunction } from 'i18next';
import type { SettingsItemProps } from '@/components/settings/SettingsItem';
import type { AriaNgOptions } from '@/config/constants';
import type { Aria2OptionItem } from '@/services/aria2SettingService';
import { getAriaNgSettingValue, type AriaNgSettingChoice, type AriaNgSettingItem } from './ariaNgSettingItems';

export type SettingsItemView = SettingsItemProps & { key: string };

interface Aria2ViewActions {
    toValuePage?: (key: string) => string;
    onRequestChoice?: (option: Aria2OptionItem) => void;
    onRequestInput?: (option: Aria2OptionItem) => void;
    onToggle?: (key: string, checked: boolean) => void;
}

interface AriaNgViewActions {
    toValuePage?: (key: string) => string;
    onRequestInput?: (item: AriaNgSettingItem) => void;
    onToggle?: (item: AriaNgSettingItem, checked: boolean) => void;
}

function ariaNgChoiceLabel(choice: AriaNgSettingChoice, t: TFunction): string {
    return choice.label ?? t(choice.labelKey ?? '', choice.labelParams);
}

export function toAria2ItemView(
    option: Aria2OptionItem,
    value: string,
    t: TFunction,
    actions: Aria2ViewActions,
): SettingsItemView {
    const label = t(option.nameKey);
    const description = t(option.descriptionKey) || undefined;
    const disabled = !!option.readonly;

    if (option.type === 'boolean') {
        return {
            key: option.key,
            label,
            description,
            disabled,
            indicator: {
                type: 'switch',
                checked: value === 'true',
                onChange: (checked) => actions.onToggle?.(option.key, checked),
            },
        };
    }

    if (option.options && option.options.length > 0) {
        const current = option.options.find((choice) => choice.value === value);
        const to = actions.toValuePage?.(option.key);

        return {
            key: option.key,
            label,
            description,
            disabled,
            indicator: { type: 'navigate', text: current ? t(current.name) : value || undefined },
            to,
            onClick: to || disabled ? undefined : () => actions.onRequestChoice?.(option),
        };
    }

    return {
        key: option.key,
        label,
        description,
        disabled,
        indicator: { type: 'value', text: value },
        onClick: disabled ? undefined : () => actions.onRequestInput?.(option),
    };
}

export function toAriaNgItemView(
    item: AriaNgSettingItem,
    options: AriaNgOptions,
    t: TFunction,
    actions: AriaNgViewActions,
): SettingsItemView {
    const label = t(item.label);
    const value = getAriaNgSettingValue(options, item);

    if (item.kind === 'switch') {
        return {
            key: item.key,
            label,
            indicator: {
                type: 'switch',
                checked: value === 'true',
                onChange: (checked) => actions.onToggle?.(item, checked),
            },
        };
    }

    if (item.kind === 'select') {
        const current = item.choices?.find((choice) => choice.value === value);

        return {
            key: item.key,
            label,
            indicator: { type: 'navigate', text: current ? ariaNgChoiceLabel(current, t) : value },
            to: actions.toValuePage?.(item.key),
        };
    }

    return {
        key: item.key,
        label,
        indicator: { type: 'value', text: value },
        onClick: () => actions.onRequestInput?.(item),
    };
}
