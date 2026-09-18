import { useTranslation } from 'react-i18next';
import Aria2OptionListPage from './Aria2OptionListPage';
import SettingsPage from './SettingsPage';
import { getSettingsCategory } from './settingsCategories';

export default function AdvancedSettingsPage() {
    const { t } = useTranslation();
    const label = getSettingsCategory('advanced')?.label;

    return (
        <SettingsPage>
            <Aria2OptionListPage
                category="advanced"
                routeBase="/settings/advanced"
                title={label ? t(label) : undefined}
            />
        </SettingsPage>
    );
}
