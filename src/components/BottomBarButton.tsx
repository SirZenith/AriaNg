import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BottomBarButtonProps {
    ariaLabel: string;
    label?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    to?: string;
    state?: unknown;
    onClick?: () => void;
    disabled?: boolean;
    hideLabelOnMobile?: boolean;
    ariaExpanded?: boolean;
    className?: string;
    children?: ReactNode;
}

export default function BottomBarButton({
    ariaLabel,
    label,
    icon: Icon,
    iconClassName,
    to,
    state,
    onClick,
    disabled,
    hideLabelOnMobile = true,
    ariaExpanded,
    className,
    children,
}: BottomBarButtonProps) {
    const classNameValue = 'bottom-bar-item' + (className ? ' ' + className : '');
    const content = (
        <>
            {Icon ? (
                <Icon className={'h-3.5 w-3.5 md:h-4 md:w-4 shrink-0' + (iconClassName ? ' ' + iconClassName : '')} aria-hidden="true" />
            ) : null}
            {label ? <span className={hideLabelOnMobile ? 'hidden md:inline' : undefined}>{label}</span> : null}
            {children}
        </>
    );

    if (to) {
        return (
            <Link to={to} state={state} className={classNameValue} title={ariaLabel} aria-label={ariaLabel}>
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button
                type="button"
                className={classNameValue}
                title={ariaLabel}
                aria-label={ariaLabel}
                aria-expanded={ariaExpanded}
                disabled={disabled}
                onClick={onClick}
            >
                {content}
            </button>
        );
    }

    return (
        <label className={classNameValue} title={ariaLabel} aria-label={ariaLabel}>
            {content}
        </label>
    );
}
