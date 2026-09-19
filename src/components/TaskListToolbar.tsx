import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Pause, Play, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SplitBottomBar from './SplitBottomBar';
import { useKeyboardShortcuts } from '@/hooks/useAria2';
import { aria2TaskService } from '@/services/taskService';
import { useSettingStore } from '@/stores/settingStore';
import { useTaskStore } from '@/stores/taskStore';

export default function TaskListToolbar() {
    const { t } = useTranslation();
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
                    <Link to="/new" className="bottom-bar-item" title={t('New')} aria-label={t('New')}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('New')}</span>
                    </Link>
                    <button
                        type="button"
                        className="bottom-bar-item"
                        disabled={selectedTasks.length < 1}
                        title={t('Start')}
                        aria-label={t('Start')}
                        onClick={() => void changeTasksState('start')}
                    >
                        <Play className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Start')}</span>
                    </button>
                    <button
                        type="button"
                        className="bottom-bar-item"
                        disabled={selectedTasks.length < 1}
                        title={t('Pause')}
                        aria-label={t('Pause')}
                        onClick={() => void changeTasksState('pause')}
                    >
                        <Pause className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Pause')}</span>
                    </button>
                    <button
                        type="button"
                        className="bottom-bar-item"
                        disabled={selectedTasks.length < 1}
                        title={t('Delete')}
                        aria-label={t('Delete')}
                        onClick={() => void removeTasks()}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Delete')}</span>
                    </button>
                    <button
                        type="button"
                        className="bottom-bar-item"
                        disabled={tasks.length < 1}
                        title={t('Select All')}
                        aria-label={t('Select All')}
                        onClick={() => selectAll()}
                    >
                        <CheckSquare className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t('Select All')}</span>
                    </button>
                </>
            }
            trailing={
                <div className="relative">
                    <button
                        type="button"
                        className="bottom-bar-item h-10 w-10 p-0"
                        title={t('Search')}
                        aria-label={t('Search')}
                        aria-expanded={searchVisible}
                        onClick={openSearch}
                    >
                        <Search className="h-4 w-4" aria-hidden="true" />
                    </button>
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
                            className="input bg-white/90 shadow-lg backdrop-blur dark:bg-gray-800/90"
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
        />
    );
}
