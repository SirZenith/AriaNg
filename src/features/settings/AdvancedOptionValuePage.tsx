import Aria2OptionValueRoutePage from './Aria2OptionValueRoutePage';
import SettingsPage from './SettingsPage';

export default function AdvancedOptionValuePage() {
    return (
        <SettingsPage>
            <Aria2OptionValueRoutePage category="advanced" />
        </SettingsPage>
    );
}
