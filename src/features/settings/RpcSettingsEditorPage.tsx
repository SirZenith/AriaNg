import { useParams } from 'react-router-dom';
import SettingsCard from '@/components/settings/SettingsCard';
import RpcSettingsEditor from './RpcSettingsEditor';
import SettingsPage from './SettingsPage';

export default function RpcSettingsEditorPage() {
    const { item } = useParams();

    return (
        <SettingsPage>
            <SettingsCard>
                <div className="p-4">
                    <RpcSettingsEditor key={item} item={item ?? 'new'} />
                </div>
            </SettingsCard>
        </SettingsPage>
    );
}
