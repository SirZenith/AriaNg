import { useTranslation } from 'react-i18next';
import Aria2OptionListPage from './Aria2OptionListPage';
import SettingsPage from './SettingsPage';
import { getSettingsCategory } from './settingsCategories';

export default function RpcGlobalSettingsPage() {
    const { t } = useTranslation();
    const label = getSettingsCategory('rpc')?.label;

    return (
        <SettingsPage>
            <Aria2OptionListPage category="rpc" routeBase="/settings/rpc" title={label ? t(label) : undefined} />
        </SettingsPage>
    );
}
