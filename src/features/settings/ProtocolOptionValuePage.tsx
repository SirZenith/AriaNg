import { useParams } from 'react-router-dom';
import Aria2OptionValueRoutePage from './Aria2OptionValueRoutePage';
import SettingsPage from './SettingsPage';

export default function ProtocolOptionValuePage() {
    const { sub } = useParams();

    return (
        <SettingsPage>
            <Aria2OptionValueRoutePage category={sub ?? ''} />
        </SettingsPage>
    );
}
