import {
    type DOMAttributes,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    useCallback,
    useRef,
    useState,
} from 'react';
import { Check, ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '@/components/Modal';
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

const longPressDelay = 500;
const tooltipBottomSpace = 96;

function isLargeScreen(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches;
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
    const [showDescription, setShowDescription] = useState(false);
    const [tooltipUp, setTooltipUp] = useState(false);
    const longPressTimer = useRef<number | undefined>(undefined);
    const longPressed = useRef(false);
    const itemRef = useRef<HTMLElement | null>(null);

    const setItemRef = useCallback((node: HTMLElement | null) => {
        itemRef.current = node;
    }, []);

    const interactive = !disabled && (!!to || !!onClick);
    const valueText = indicator.type === 'navigate' || indicator.type === 'value' ? indicator.text : undefined;
    const hasDescription = !!description;

    const updateTooltipPlacement = () => {
        if (!hasDescription || !isLargeScreen()) {
            return;
        }

        const rect = itemRef.current?.getBoundingClientRect();

        if (!rect) {
            return;
        }

        setTooltipUp(window.innerHeight - rect.bottom < tooltipBottomSpace);
    };

    const startLongPress = () => {
        if (!hasDescription || disabled || isLargeScreen()) {
            return;
        }

        longPressed.current = false;
        longPressTimer.current = window.setTimeout(() => {
            longPressed.current = true;
            setShowDescription(true);
        }, longPressDelay);
    };

    const cancelLongPress = () => {
        if (longPressTimer.current !== undefined) {
            window.clearTimeout(longPressTimer.current);
            longPressTimer.current = undefined;
        }
    };

    const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
        if (longPressed.current) {
            event.preventDefault();
            event.stopPropagation();
            longPressed.current = false;
            return;
        }

        onClick?.();
    };

    const pressHandlers: DOMAttributes<HTMLElement> = hasDescription
        ? {
              onPointerEnter: updateTooltipPlacement,
              onPointerDown: startLongPress,
              onPointerUp: cancelLongPress,
              onPointerLeave: cancelLongPress,
              onPointerCancel: cancelLongPress,
              onContextMenu: (event) => {
                  if (!isLargeScreen()) {
                      event.preventDefault();
                  }
              },
              onClick: handleClick,
          }
        : { onClick };

    const content = (
        <>
            {hasDescription ? (
                <span
                    className={
                        'settings-tooltip lg:group-hover:block lg:group-focus-within:block' +
                        (tooltipUp ? ' settings-tooltip-up' : '')
                    }
                >
                    {description}
                </span>
            ) : null}
            {Icon ? <Icon className="settings-item-icon" aria-hidden="true" /> : null}
            <span className="settings-item-text">
                <span className="settings-item-title">{label}</span>
            </span>
            {valueText ? (
                <span className="settings-item-value" title={valueText}>
                    {valueText}
                </span>
            ) : null}
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

    const className = 'settings-item group relative' + (interactive ? ' settings-item-interactive' : '');

    const element =
        to && !disabled ? (
            <Link
                ref={setItemRef}
                to={to}
                className={className}
                role={role}
                aria-selected={ariaSelected}
                {...pressHandlers}
            >
                {content}
            </Link>
        ) : onClick && !disabled ? (
            <button
                ref={setItemRef}
                type="button"
                className={className}
                role={role}
                aria-selected={ariaSelected}
                {...pressHandlers}
            >
                {content}
            </button>
        ) : (
            <div
                ref={setItemRef}
                className={className}
                role={role}
                aria-selected={ariaSelected}
                aria-disabled={disabled || undefined}
                {...pressHandlers}
            >
                {content}
            </div>
        );

    return (
        <>
            {element}
            {showDescription && hasDescription ? (
                <Modal title={typeof label === 'string' ? label : ''} onClose={() => setShowDescription(false)}>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{description}</div>
                </Modal>
            ) : null}
        </>
    );
}
