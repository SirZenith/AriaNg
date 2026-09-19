import AriaNgGeneralSettingsItemList from '@/features/settings/AriaNgGeneralSettingsItemList';
import SettingsPage from './SettingsPage';
import SettingsSection from '@/components/settings/SettingsSection';

export default function AriaNgGeneralSettingsPage() {
    return (
        <SettingsPage>
            <SettingsSection >
                <AriaNgGeneralSettingsItemList />
            </SettingsSection>
        </SettingsPage>
    );
}
