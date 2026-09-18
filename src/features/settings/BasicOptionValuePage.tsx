import Aria2OptionValueRoutePage from './Aria2OptionValueRoutePage';
import SettingsPage from './SettingsPage';

export default function BasicOptionValuePage() {
    return (
        <SettingsPage>
            <Aria2OptionValueRoutePage category="basic" />
        </SettingsPage>
    );
}
