import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { getAriaNgSettingItem } from '@/features/settings/ariaNgSettingItems';
import { getRpcSettingFieldItem } from '@/features/settings/rpcSettingFieldItems';
import { getSettingsCategory, getSettingsSubItem } from '@/features/settings/settingsCategories';
import { aria2SettingService } from '@/services/aria2SettingService';
import { getAllRpcSettings } from '@/services/settingService';

const settingsBase = '/settings';

function resolveOptionTitle(
    type: string | undefined,
    sub: string | undefined,
    item: string | undefined,
): string | null {
    if (!type || !item) {
        return null;
    }

    const category = type === 'basic' || type === 'advanced' ? type : type === 'protocol' ? sub : undefined;

    if (!category) {
        return null;
    }

    const keys = aria2SettingService.getAvailableGlobalOptionsKeys(category);

    if (!Array.isArray(keys) || keys.indexOf(item) < 0) {
        return null;
    }

    return 'options.' + item + '.name';
}

function resolveItemTitle(type: string | undefined, sub: string | undefined, item: string | undefined): string {
    if (type === 'ariang' && sub === 'settings' && item) {
        const label = getAriaNgSettingItem(item)?.label;

        if (label) {
            return label;
        }
    }

    if (type === 'ariang' && sub === 'rpc' && item) {
        if (item === 'new') {
            return 'Add New RPC Setting';
        }

        const setting = getAllRpcSettings()[Number(item)];

        if (setting) {
            return setting.rpcAlias || setting.rpcHost + ':' + setting.rpcPort;
        }
    }

    return resolveOptionTitle(type, sub, item) ?? 'Aria2 Settings';
}

function resolveSettingsLocation(pathname: string): { title: string; backTo: string } {
    const fieldMatch = matchPath('/settings/:type/:sub/:item/:field', pathname);

    if (fieldMatch) {
        const { item, field } = fieldMatch.params;

        return {
            title: getRpcSettingFieldItem(field)?.label || 'Aria2 Settings',
            backTo: settingsBase + '/ariang/rpc/' + (item || ''),
        };
    }

    const itemMatch = matchPath('/settings/:type/:sub/:item', pathname);

    if (itemMatch) {
        const { type, sub, item } = itemMatch.params;
        const backTo =
            type === 'basic' || type === 'advanced'
                ? settingsBase + '/' + type
                : type === 'protocol'
                  ? settingsBase + '/protocol'
                  : settingsBase + '/' + (type || '') + '/' + (sub || '');

        return {
            title: resolveItemTitle(type, sub, item),
            backTo,
        };
    }

    const subMatch = matchPath('/settings/:type/:sub', pathname);

    if (subMatch) {
        const { type, sub } = subMatch.params;
        const subItem = type && sub ? getSettingsSubItem(type, sub) : undefined;

        return {
            title: subItem?.label || 'Aria2 Settings',
            backTo: settingsBase + '/' + (type || ''),
        };
    }

    const typeMatch = matchPath('/settings/:type', pathname);

    if (typeMatch?.params.type) {
        const category = getSettingsCategory(typeMatch.params.type);

        return { title: category?.label || 'Aria2 Settings', backTo: settingsBase };
    }

    return { title: 'Aria2 Settings', backTo: '/home' };
}

export default function SettingsToolbar() {
    const { t } = useTranslation();
    const location = useLocation();
    const { title, backTo } = resolveSettingsLocation(location.pathname);

    return (
        <div className="toolbar-title-container">
            <Link to={backTo} className="toolbar-icon-btn" title={t('Back')} aria-label={t('Back')}>
                <ChevronLeft className="h-7 w-7" aria-hidden="true" />
            </Link>
            <span className="toolbar-title-text">{t(title)}</span>
        </div>
    );
}
