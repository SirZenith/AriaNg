import { useTranslation } from 'react-i18next';
import Aria2OptionListPage from './Aria2OptionListPage';
import SettingsPage from './SettingsPage';
import { getSettingsCategory } from './settingsCategories';

export default function BasicSettingsPage() {
    const { t } = useTranslation();
    const label = getSettingsCategory('basic')?.label;

    return (
        <SettingsPage>
            <Aria2OptionListPage category="basic" routeBase="/settings/basic" title={label ? t(label) : undefined} />
        </SettingsPage>
    );
}
