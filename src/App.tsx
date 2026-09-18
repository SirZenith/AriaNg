import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import CommandHandler from '@/features/command/CommandHandler';
import DebugPage from '@/features/debug/DebugPage';
import NewTaskPage from '@/features/new-task/NewTaskPage';
import Aria2SettingsPage from '@/features/settings/Aria2SettingsPage';
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
                    <Route path="/settings/ariang" element={<Navigate to="/settings/aria2/ariang" replace />} />
                    <Route path="/settings/aria2" element={<Navigate to="/settings/aria2/basic" replace />} />
                    <Route path="/settings/aria2/:type" element={<Aria2SettingsPage />} />
                    <Route path="/settings/rpc/set/*" element={<CommandHandler />} />
                    <Route path="/status" element={<Navigate to="/settings/aria2/status" replace />} />
                    <Route path="/debug" element={<DebugPage />} />
                    <Route path="*" element={<Navigate to="/downloading" replace />} />
                </Routes>
            </AppLayout>
        </HashRouter>
    );
}
