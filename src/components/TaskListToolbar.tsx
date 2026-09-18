import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Pause, Play, Plus, Search, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useKeyboardShortcuts } from '@/hooks/useAria2';
import { aria2TaskService } from '@/services/taskService';
import { useSettingStore } from '@/stores/settingStore';
import { useTaskStore } from '@/stores/taskStore';

const toolbarButtonClass = 'toolbar-btn';

export default function TaskListToolbar() {
    const { t } = useTranslation();
    const desktopSearchRef = useRef<HTMLInputElement>(null);
    const mobileSearchRef = useRef<HTMLInputElement>(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

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

    const focusSearchBox = () => {
        if (window.matchMedia('(min-width: 640px)').matches) {
            desktopSearchRef.current?.focus();
            return;
        }

        setShowMobileSearch(true);
        window.setTimeout(() => mobileSearchRef.current?.focus(), 0);
    };

    useKeyboardShortcuts({
        selectAll: () => selectAll(),
        delete: () => {
            void removeTasks();
        },
        find: focusSearchBox,
    });

    return (
        <div className="mx-auto flex w-full max-w-[1000px] flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
            <div className="flex items-center gap-0.5 sm:gap-1">
                <Link to="/new" className={toolbarButtonClass} title={t('New')} aria-label={t('New')}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden md:inline">{t('New')}</span>
                </Link>
                <button
                    type="button"
                    className={toolbarButtonClass}
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
                    className={toolbarButtonClass}
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
                    className={toolbarButtonClass}
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
                    className={toolbarButtonClass}
                    disabled={tasks.length < 1}
                    title={t('Select All')}
                    aria-label={t('Select All')}
                    onClick={() => selectAll()}
                >
                    <CheckSquare className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden md:inline">{t('Select All')}</span>
                </button>
            </div>

            <div className="ml-auto hidden items-center gap-2 sm:flex">
                <input
                    ref={desktopSearchRef}
                    type="text"
                    className="toolbar-input w-40 lg:w-56"
                    placeholder={t('Search')}
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                />
            </div>

            <button
                type="button"
                className={toolbarButtonClass + ' ml-auto sm:hidden'}
                title={t('Search')}
                aria-label={t('Search')}
                aria-expanded={showMobileSearch}
                onClick={() => setShowMobileSearch((value) => !value)}
            >
                <Search className="h-4 w-4" aria-hidden="true" />
            </button>

            {showMobileSearch ? (
                <div className="flex w-full items-center gap-1 sm:hidden">
                    <input
                        ref={mobileSearchRef}
                        type="text"
                        className="toolbar-input min-w-0 flex-1"
                        placeholder={t('Search')}
                        value={searchKeyword}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                    />
                    <button
                        type="button"
                        className="toolbar-btn"
                        title={t('Close')}
                        aria-label={t('Close')}
                        onClick={() => setShowMobileSearch(false)}
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}
