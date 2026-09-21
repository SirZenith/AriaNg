import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Pause, Play, Plus, Search, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import BottomBarButton from './BottomBarButton';
import SplitBottomBar from './SplitBottomBar';
import { useKeyboardShortcuts } from '@/hooks/useAria2';
import { aria2TaskService } from '@/services/taskService';
import { useSettingStore } from '@/stores/settingStore';
import { useTaskStore } from '@/stores/taskStore';

export default function TaskListToolbar() {
    const { t } = useTranslation();
    const location = useLocation();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchVisible, setSearchVisible] = useState(false);

    const options = useSettingStore((state) => state.options);
    const tasks = useTaskStore((state) => state.tasks);
    const selected = useTaskStore((state) => state.selected);
    const searchKeyword = useTaskStore((state) => state.searchKeyword);
    const setSearchKeyword = useTaskStore((state) => state.setSearchKeyword);
    const clearSelected = useTaskStore((state) => state.clearSelected);
    const selectAll = useTaskStore((state) => state.selectAll);

    const selectedTasks = tasks.filter((task) => selected[task.gid]);

    const changeTasksState = async (state: 'start' | 'pause') => {
        const gids = selectedTasks.map((task) => task.gid);

        if (gids.length < 1) {
            return;
        }

        if (state === 'start') {
            await aria2TaskService.startTasks(gids);
        } else {
            await aria2TaskService.pauseTasks(gids);
        }

        clearSelected();
    };

    const removeTasks = async () => {
        if (selectedTasks.length < 1) {
            return;
        }

        if (options.confirmTaskRemoval && !window.confirm(t('Are you sure you want to remove the selected tasks?'))) {
            return;
        }

        await aria2TaskService.removeTasks(selectedTasks);
        clearSelected();
    };

    const openSearch = () => {
        setSearchVisible(true);
    };

    useEffect(() => {
        if (searchVisible) {
            searchInputRef.current?.focus();
        }
    }, [searchVisible]);

    useKeyboardShortcuts({
        selectAll: () => selectAll(),
        delete: () => {
            void removeTasks();
        },
        find: openSearch,
    });

    return (
        <SplitBottomBar
            leading={
                <>
                    <BottomBarButton
                        to="/new"
                        state={{ from: location.pathname }}
                        ariaLabel={t('New')}
                        label={t('New')}
                        icon={Plus}
                        iconClassName="text-primary dark:text-primary-light"
                    />
                    <BottomBarButton
                        ariaLabel={t('Start')}
                        label={t('Start')}
                        icon={Play}
                        iconClassName="text-green-600 dark:text-green-500"
                        disabled={selectedTasks.length < 1}
                        onClick={() => void changeTasksState('start')}
                    />
                    <BottomBarButton
                        ariaLabel={t('Pause')}
                        label={t('Pause')}
                        icon={Pause}
                        iconClassName="text-amber-600 dark:text-amber-400"
                        disabled={selectedTasks.length < 1}
                        onClick={() => void changeTasksState('pause')}
                    />
                    <BottomBarButton
                        ariaLabel={t('Delete')}
                        label={t('Delete')}
                        icon={Trash2}
                        iconClassName="text-red-600 dark:text-red-400"
                        disabled={selectedTasks.length < 1}
                        onClick={() => void removeTasks()}
                    />
                    <BottomBarButton
                        ariaLabel={t('Select All')}
                        label={t('Select All')}
                        icon={CheckSquare}
                        iconClassName="text-primary dark:text-primary-light"
                        disabled={tasks.length < 1}
                        onClick={() => selectAll()}
                    />
                </>
            }
            trailing={
                <div className="relative">
                    <BottomBarButton
                        ariaLabel={t('Search')}
                        icon={Search}
                        iconClassName="text-primary dark:text-primary-light"
                        ariaExpanded={searchVisible}
                        className="h-7 w-7 md:h-10 md:w-10 p-0"
                        onClick={openSearch}
                    />
                    <div
                        className={
                            'absolute right-0 bottom-full mb-3 w-64 max-w-[80vw] transition-opacity duration-300 ' +
                            (searchVisible ? 'opacity-100' : 'pointer-events-none opacity-0')
                        }
                    >
                        <input
                            ref={searchInputRef}
                            type="text"
                            tabIndex={searchVisible ? 0 : -1}
                            className="input bg-white/90 shadow-[0_2px_6px_rgba(46,52,64,0.08),0_16px_40px_-12px_rgba(46,52,64,0.35)] backdrop-blur-xl dark:bg-gray-800/90"
                            placeholder={t('Search')}
                            value={searchKeyword}
                            onBlur={() => {
                                if (!searchKeyword) {
                                    setSearchVisible(false);
                                }
                            }}
                            onChange={(event) => setSearchKeyword(event.target.value)}
                        />
                    </div>
                </div>
            }
            restrictWidth
        />
    );
}
