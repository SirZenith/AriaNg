import SettingsMenu from './SettingsMenu';
import SettingsPage from './SettingsPage';

export default function SettingsMenuPage({ type }: { type: string }) {
    return (
        <SettingsPage>
            <SettingsMenu type={type} />
        </SettingsPage>
    );
}
