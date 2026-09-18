import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import CommandHandler from '@/features/command/CommandHandler';
import DebugPage from '@/features/debug/DebugPage';
import NewTaskPage from '@/features/new-task/NewTaskPage';
import AdvancedOptionValuePage from '@/features/settings/AdvancedOptionValuePage';
import AdvancedSettingsPage from '@/features/settings/AdvancedSettingsPage';
import AriaNgSettingsPage from '@/features/settings/AriaNgSettingsPage';
import AriaNgSettingValuePage from '@/features/settings/AriaNgSettingValuePage';
import BasicOptionValuePage from '@/features/settings/BasicOptionValuePage';
import BasicSettingsPage from '@/features/settings/BasicSettingsPage';
import ImportExportPage from '@/features/settings/ImportExportPage';
import { protocolCategories } from '@/features/settings/protocolCategories';
import ProtocolOptionValuePage from '@/features/settings/ProtocolOptionValuePage';
import ProtocolSettingsPage from '@/features/settings/ProtocolSettingsPage';
import RpcGlobalSettingsPage from '@/features/settings/RpcGlobalSettingsPage';
import RpcSettingsEditorPage from '@/features/settings/RpcSettingsEditorPage';
import RpcSettingFieldPage from '@/features/settings/RpcSettingFieldPage';
import RpcSettingsListPage from '@/features/settings/RpcSettingsListPage';
import SettingsHomePage from '@/features/settings/SettingsHomePage';
import SettingsMenuPage from '@/features/settings/SettingsMenuPage';
import StatusPage from '@/features/settings/StatusPage';
import TaskDetailPage from '@/features/task-detail/TaskDetailPage';
import TaskListPage from '@/features/task-list/TaskListPage';

export default function App() {
    return (
        <HashRouter>
            <AppLayout>
                <Routes>
                    <Route path="/downloading" element={<TaskListPage location="downloading" />} />
                    <Route path="/waiting" element={<TaskListPage location="waiting" />} />
                    <Route path="/stopped" element={<TaskListPage location="stopped" />} />
                    <Route path="/new" element={<NewTaskPage />} />
                    <Route path="/new/*" element={<CommandHandler />} />
                    <Route path="/task/detail/:gid" element={<TaskDetailPage />} />
                    <Route path="/settings" element={<SettingsHomePage />} />
                    <Route path="/settings/status" element={<StatusPage />} />
                    <Route path="/settings/basic" element={<BasicSettingsPage />} />
                    <Route path="/settings/basic/:option" element={<BasicOptionValuePage />} />
                    <Route path="/settings/advanced" element={<AdvancedSettingsPage />} />
                    <Route path="/settings/advanced/:option" element={<AdvancedOptionValuePage />} />
                    <Route path="/settings/rpc" element={<RpcGlobalSettingsPage />} />
                    <Route path="/settings/protocol" element={<SettingsMenuPage type="protocol" />} />
                    <Route path="/settings/protocol/:sub" element={<ProtocolSettingsPage />} />
                    <Route path="/settings/protocol/:sub/:option" element={<ProtocolOptionValuePage />} />
                    <Route path="/settings/ariang" element={<SettingsMenuPage type="ariang" />} />
                    <Route path="/settings/ariang/settings" element={<AriaNgSettingsPage />} />
                    <Route path="/settings/ariang/settings/:item" element={<AriaNgSettingValuePage />} />
                    <Route path="/settings/ariang/rpc" element={<RpcSettingsListPage />} />
                    <Route path="/settings/ariang/rpc/:item" element={<RpcSettingsEditorPage />} />
                    <Route path="/settings/ariang/rpc/:item/:field" element={<RpcSettingFieldPage />} />
                    <Route path="/settings/ariang/importExport" element={<ImportExportPage />} />
                    {protocolCategories.map((category) => (
                        <Route
                            key={category.key}
                            path={'/settings/' + category.key}
                            element={<Navigate to={'/settings/protocol/' + category.key} replace />}
                        />
                    ))}
                    <Route path="/settings/rpc/set/*" element={<CommandHandler />} />
                    <Route path="/status" element={<Navigate to="/settings/status" replace />} />
                    <Route path="/debug" element={<DebugPage />} />
                    <Route path="/settings/*" element={<Navigate to="/settings" replace />} />
                    <Route path="*" element={<Navigate to="/downloading" replace />} />
                </Routes>
            </AppLayout>
        </HashRouter>
    );
}
