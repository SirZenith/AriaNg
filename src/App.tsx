import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import CommandHandler from '@/features/command/CommandHandler';
import DebugPage from '@/features/debug/DebugPage';
import HomePage from '@/features/home/HomePage';
import NewTaskPage from '@/features/new-task/NewTaskPage';
import AdvancedOptionValuePage from '@/features/settings/AdvancedOptionValuePage';
import AdvancedSettingsPage from '@/features/settings/AdvancedSettingsPage';
import AriaNgGeneralSettingsPage from '@/features/settings/AriaNgGeneralSettingsPage';
import AriaNgGeneralSettingValuePage from '@/features/settings/AriaNgGeneralSettingValuePage';
import BasicOptionValuePage from '@/features/settings/BasicOptionValuePage';
import BasicSettingsPage from '@/features/settings/BasicSettingsPage';
import ImportExportPage from '@/features/settings/ImportExportPage';
import { protocolCategories } from '@/features/settings/protocolCategories';
import ProtocolOptionValuePage from '@/features/settings/ProtocolOptionValuePage';
import ProtocolSettingsPage from '@/features/settings/ProtocolSettingsPage';
import RpcGlobalSettingsPage from '@/features/settings/RpcGlobalSettingsPage';
import RpcSettingsEditorPage from '@/features/settings/RpcSettingsEditorPage';
import RpcSettingFieldPage from '@/features/settings/RpcSettingFieldPage';
import AriaNgRpcSettingsListPage from '@/features/settings/AriaNgRpcSettingsListPage';
import SettingsHomePage from '@/features/settings/SettingsHomePage';
import StatusPage from '@/features/settings/StatusPage';
import TaskDetailPage from '@/features/task-detail/TaskDetailPage';
import TaskListPage from '@/features/task-list/TaskListPage';

export default function App() {
    return (
        <HashRouter>
            <AppLayout>
                <Routes>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/tasks/downloading" element={<TaskListPage location="downloading" />} />
                    <Route path="/tasks/waiting" element={<TaskListPage location="waiting" />} />
                    <Route path="/tasks/stopped" element={<TaskListPage location="stopped" />} />
                    <Route path="/new" element={<NewTaskPage />} />
                    <Route path="/new/*" element={<CommandHandler />} />
                    <Route path="/task/detail/:gid" element={<TaskDetailPage />} />
                    <Route path="/ariang" element={<Navigate to="/home" replace />} />
                    <Route path="/ariang/general" element={<AriaNgGeneralSettingsPage />} />
                    <Route path="/ariang/general/:item" element={<AriaNgGeneralSettingValuePage />} />
                    <Route path="/ariang/rpc" element={<AriaNgRpcSettingsListPage />} />
                    <Route path="/ariang/rpc/:item" element={<RpcSettingsEditorPage />} />
                    <Route path="/ariang/rpc/:item/:field" element={<RpcSettingFieldPage />} />
                    <Route path="/ariang/importExport" element={<ImportExportPage />} />
                    <Route path="/ariang/*" element={<Navigate to="/home" replace />} />
                    <Route path="/settings" element={<SettingsHomePage />} />
                    <Route path="/settings/status" element={<StatusPage />} />
                    <Route path="/settings/basic" element={<BasicSettingsPage />} />
                    <Route path="/settings/basic/:option" element={<BasicOptionValuePage />} />
                    <Route path="/settings/advanced" element={<AdvancedSettingsPage />} />
                    <Route path="/settings/advanced/:option" element={<AdvancedOptionValuePage />} />
                    <Route path="/settings/rpc" element={<RpcGlobalSettingsPage />} />
                    <Route path="/settings/protocol" element={<ProtocolSettingsPage />} />
                    <Route path="/settings/protocol/:sub/:option" element={<ProtocolOptionValuePage />} />
                    {protocolCategories.map((category) => (
                        <Route
                            key={category.key}
                            path={'/settings/' + category.key}
                            element={<Navigate to="/settings/protocol" replace />}
                        />
                    ))}
                    <Route path="/settings/rpc/set/*" element={<CommandHandler />} />
                    <Route path="/debug" element={<DebugPage />} />
                    <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </AppLayout>
        </HashRouter>
    );
}
