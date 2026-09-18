import type { ReactNode } from 'react';
import { Check, ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Switch from '@/components/Switch';

export type SettingsIndicator =
    | { type: 'navigate'; text?: string }
    | { type: 'value'; text: string }
    | { type: 'check'; selected: boolean }
    | { type: 'switch'; checked: boolean; onChange: (checked: boolean) => void; };

export interface SettingsItemProps {
    icon?: LucideIcon;
    label: ReactNode;
    description?: ReactNode;
    indicator: SettingsIndicator;
    to?: string;
    onClick?: () => void;
    disabled?: boolean;
    role?: string;
    ariaSelected?: boolean;
}

export default function SettingsItem({
    icon: Icon,
    label,
    description,
    indicator,
    to,
    onClick,
    disabled = false,
    role,
    ariaSelected,
}: SettingsItemProps) {
    const interactive = !disabled && (!!to || !!onClick);
    const valueText = indicator.type === 'navigate' || indicator.type === 'value' ? indicator.text : undefined;

    const content = (
        <>
            {Icon ? <Icon className="settings-item-icon" aria-hidden="true" /> : null}
            <span className="settings-item-text">
                <span className="settings-item-title">{label}</span>
                {description ? <span className="settings-item-description">{description}</span> : null}
            </span>
            {valueText ? <span className="settings-item-value">{valueText}</span> : null}
            {(indicator.type === 'navigate' || indicator.type === 'value') && !disabled ? (
                <ChevronRight className="settings-item-indicator" aria-hidden="true" />
            ) : null}
            {indicator.type === 'check' && indicator.selected ? (
                <Check className="settings-item-check" aria-hidden="true" />
            ) : null}
            {indicator.type === 'switch' ? (
                <span className="shrink-0">
                    <Switch
                        checked={indicator.checked}
                        onChange={indicator.onChange}
                        disabled={disabled}
                        aria-label={typeof label === 'string' ? label : undefined}
                    />
                </span>
            ) : null}
        </>
    );

    const className = 'settings-item' + (interactive ? ' settings-item-interactive' : '');

    if (to && !disabled) {
        return (
            <Link to={to} className={className} role={role} aria-selected={ariaSelected}>
                {content}
            </Link>
        );
    }

    if (onClick && !disabled) {
        return (
            <button type="button" className={className} role={role} aria-selected={ariaSelected} onClick={onClick}>
                {content}
            </button>
        );
    }

    return (
        <div className={className} role={role} aria-selected={ariaSelected} aria-disabled={disabled || undefined}>
            {content}
        </div>
    );
}
