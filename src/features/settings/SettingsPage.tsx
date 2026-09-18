import type { ReactNode } from 'react';
import SettingsToolbar from '@/components/SettingsToolbar';

export default function SettingsPage({ children }: { children: ReactNode }) {
    return (
        <div className="space-y-3">
            <SettingsToolbar />
            {children}
        </div>
    );
}
