import type { ReactNode } from 'react';

interface SettingsCardProps {
    children: ReactNode;
    className?: string;
}

export default function SettingsCard({ children, className }: SettingsCardProps) {
    return <div className={className ? 'settings-card ' + className : 'settings-card'}>{children}</div>;
}
