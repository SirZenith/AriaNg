import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { getSettingsCategory, getSettingsSubItem } from '@/features/settings/settingsCategories';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getAllRpcSettings } from '@/services/settingService';
import RpcSelector from './RpcSelector';

const settingsBase = '/settings/aria2';

function resolveItemTitle(type: string | undefined, sub: string | undefined, item: string | undefined): string {
    if (type === 'ariang' && sub === 'rpc' && item) {
        if (item === 'new') {
            return 'Add New RPC Setting';
        }

        const setting = getAllRpcSettings()[Number(item)];

        if (setting) {
            return setting.rpcAlias || setting.rpcHost + ':' + setting.rpcPort;
        }
    }

    return 'Aria2 Settings';
}

function resolveSettingsLocation(pathname: string): { title: string; backTo: string } {
    const itemMatch = matchPath('/settings/aria2/:type/:sub/:item', pathname);

    if (itemMatch) {
        const { type, sub, item } = itemMatch.params;

        return {
            title: resolveItemTitle(type, sub, item),
            backTo: settingsBase + '/' + (type || '') + '/' + (sub || ''),
        };
    }

    const subMatch = matchPath('/settings/aria2/:type/:sub', pathname);

    if (subMatch) {
        const { type, sub } = subMatch.params;
        const subItem = type && sub ? getSettingsSubItem(type, sub) : undefined;

        return {
            title: subItem?.label || 'Aria2 Settings',
            backTo: settingsBase + '/' + (type || ''),
        };
    }

    const typeMatch = matchPath('/settings/aria2/:type', pathname);

    if (typeMatch?.params.type) {
        const category = getSettingsCategory(typeMatch.params.type);

        return { title: category?.label || 'Aria2 Settings', backTo: settingsBase };
    }

    return { title: 'Aria2 Settings', backTo: '/downloading' };
}

export default function SettingsToolbar() {
    const { t } = useTranslation();
    const location = useLocation();
    const isMobile = useMediaQuery('(max-width: 1023px)');

    if (!isMobile) {
        return (
            <div className="mx-auto flex w-full max-w-250 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
                <RpcSelector />
            </div>
        );
    }

    const { title, backTo } = resolveSettingsLocation(location.pathname);

    return (
        <div className="mx-auto flex w-full max-w-250 items-center gap-x-1.5">
            <Link to={backTo} className="toolbar-icon-btn" title={t('Back')} aria-label={t('Back')}>
                <ChevronLeft className="h-7 w-7" aria-hidden="true" />
            </Link>
            <span className="min-w-0 flex-1 truncate text-lg font-medium">{t(title)}</span>
        </div>
    );
}
