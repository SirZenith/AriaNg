import type { ReactNode } from 'react';
import SettingsToolbar from '@/components/SettingsToolbar';
import TopBar from '@/components/TopBar';

export default function SettingsPage({ children }: { children: ReactNode }) {
    return (
        <div>
            <TopBar>
                <SettingsToolbar />
            </TopBar>
            {children}
        </div>
    );
}
