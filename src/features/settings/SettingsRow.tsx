import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SettingsRowProps {
    label: ReactNode;
    description?: string;
    valueText?: string;
    to?: string;
    children?: ReactNode;
}

const rowClass =
    'flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm last:border-b-0 dark:border-gray-700';

export default function SettingsRow({ label, description, valueText, to, children }: SettingsRowProps) {
    const content = (
        <>
            <span className="min-w-0 flex-1">
                <span className="block truncate">{label}</span>
                {description ? (
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{description}</span>
                ) : null}
            </span>
            {valueText ? <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{valueText}</span> : null}
            {children ? <span className="shrink-0">{children}</span> : null}
            {to ? <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" /> : null}
        </>
    );

    if (to) {
        return (
            <Link to={to} className={rowClass + ' hover:bg-gray-50 dark:hover:bg-gray-900'}>
                {content}
            </Link>
        );
    }

    return <div className={rowClass}>{content}</div>;
}
