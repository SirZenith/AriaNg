import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import Aria2OptionListPage from './Aria2OptionListPage';
import { protocolCategories } from './protocolCategories';
import SettingsPage from './SettingsPage';

export default function ProtocolSettingsPage() {
    const { t } = useTranslation();
    const { sub } = useParams();
    const category = sub ?? protocolCategories[0].key;
    const label = protocolCategories.find((entry) => entry.key === category)?.label;

    return (
        <SettingsPage>
            <Aria2OptionListPage
                category={category}
                routeBase={'/settings/protocol/' + category}
                title={label ? t(label) : undefined}
            />
        </SettingsPage>
    );
}
