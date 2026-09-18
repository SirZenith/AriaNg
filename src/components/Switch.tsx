interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    'aria-label'?: string;
}

export default function Switch({ checked, onChange, disabled, 'aria-label': ariaLabel }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            className={'switch ' + (checked ? 'switch-on' : '')}
            onClick={() => onChange(!checked)}
        >
            <span className="switch-thumb" />
        </button>
    );
}
