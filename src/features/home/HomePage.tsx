import { ListTodo, Home, CirclePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SettingsItem from '@/components/settings/SettingsItem';
import AriaNgRpcSettingsMenu from '@/features/settings/AriaNgRpcSettingsMenu';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useTaskStore } from '@/stores/taskStore';
import RpcConnectionCard from './RpcConnectionCard';
import TopBar from '@/components/TopBar';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsMenu from '@/features/settings/SettingsMenu';
import AriaNgSettingsMenu from '@/features/settings/AriaNgSettingsMenu';

export default function HomePage() {
    const { t } = useTranslation();
    const rpcStatus = useTaskStore((state) => state.rpcStatus);

    useScrollRestoration('home');

    if (rpcStatus !== 'Connected') {
        return (
            <section className="space-y-3">
                <AriaNgRpcSettingsMenu />
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
                    <SettingsItem
                        icon={CirclePlus}
                        label={t('New')}
                        indicator={{ type: 'navigate' }}
                        to="/new"
                        state={{ from: '/home' }}
                    />
                </SettingsSection>

                <SettingsSection title={t('AriaNg Settings')}>
                    <AriaNgSettingsMenu />
                </SettingsSection>

                <SettingsSection title={t('Settings')}>
                    <SettingsMenu />
                </SettingsSection>
            </section>
        </>
    );
}
