import type { ReactNode } from 'react';
import SettingsCard from './SettingsCard';

interface SettingsSectionProps {
    title?: string;
    children: ReactNode;
}

export default function SettingsSection({ title, children }: SettingsSectionProps) {
    return (
        <section>
            {title ? <h2 className="settings-section-title">{title}</h2> : null}
            <SettingsCard>{children}</SettingsCard>
        </section>
    );
}
