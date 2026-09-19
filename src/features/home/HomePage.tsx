import { ListTodo, Settings, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SettingsItem from '@/components/settings/SettingsItem';
import RpcSettingsMenu from '@/features/settings/RpcSettingsMenu';
import { useTaskStore } from '@/stores/taskStore';
import RpcConnectionCard from './RpcConnectionCard';
import BottomBar from '@/components/BottomBar';
import TopBar from '@/components/TopBar';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsMenu from '@/features/settings/SettingsMenu';

export default function HomePage() {
    const { t } = useTranslation();
    const rpcStatus = useTaskStore((state) => state.rpcStatus);

    if (rpcStatus !== 'Connected') {
        return (
            <section className="space-y-3">
                <RpcSettingsMenu />
            </section>
        );
    }

    return (
        <>
            <TopBar>
                <div className="toolbar-title-container">
                    <span className="toolbar-icon-btn">
                        <Home className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <span className="toolbar-title-text">Aria2</span>
                </div>
            </TopBar>

            <section className="space-y-3">
                <RpcConnectionCard />

                <SettingsSection title={t('Tasks')}>
                    <SettingsItem
                        icon={ListTodo}
                        label={t('Tasks')}
                        indicator={{ type: 'navigate' }}
                        to="/tasks/downloading"
                    />
                </SettingsSection>

                <SettingsSection title={t('AriaNg Settings')}>
                    <SettingsMenu type="ariang" />
                </SettingsSection>

                <SettingsSection title={t('Settings')}>
                    <SettingsMenu />
                </SettingsSection>
            </section>
        </>
    );
}
