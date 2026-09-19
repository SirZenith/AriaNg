import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { getAriaNgSettingItem } from '@/features/settings/ariaNgSettingItems';
import { getRpcSettingFieldItem } from '@/features/settings/rpcSettingFieldItems';
import { getSettingsCategory, getSettingsSubItem } from '@/features/settings/settingsCategories';
import { aria2SettingService } from '@/services/aria2SettingService';
import { getAllRpcSettings } from '@/services/settingService';

const settingsBase = '/settings';
const ariaNgBase = '/ariang';

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

function resolveAriaNgLocation(pathname: string): { title: string; backTo: string } | null {
    const fieldMatch = matchPath('/ariang/rpc/:item/:field', pathname);

    if (fieldMatch) {
        const { item, field } = fieldMatch.params;

        return {
            title: getRpcSettingFieldItem(field)?.label || 'RPC Settings',
            backTo: ariaNgBase + '/rpc/' + (item || ''),
        };
    }

    const rpcItemMatch = matchPath('/ariang/rpc/:item', pathname);

    if (rpcItemMatch) {
        const { item } = rpcItemMatch.params;
        let title = 'RPC Settings';

        if (item === 'new') {
            title = 'Add New RPC Setting';
        } else {
            const setting = getAllRpcSettings()[Number(item)];

            if (setting) {
                title = setting.rpcAlias || setting.rpcHost + ':' + setting.rpcPort;
            }
        }

        return { title, backTo: ariaNgBase + '/rpc' };
    }

    if (matchPath('/ariang/rpc', pathname)) {
        return { title: 'RPC Settings', backTo: '/home' };
    }

    const generalItemMatch = matchPath('/ariang/general/:item', pathname);

    if (generalItemMatch) {
        const label = getAriaNgSettingItem(generalItemMatch.params.item || '')?.label;

        return { title: label || 'Settings', backTo: ariaNgBase + '/general' };
    }

    if (matchPath('/ariang/general', pathname)) {
        return { title: 'Settings', backTo: '/home' };
    }

    if (matchPath('/ariang/importExport', pathname)) {
        return { title: 'Import / Export AriaNg Settings', backTo: '/home' };
    }

    return null;
}

function resolveSettingsLocation(pathname: string): { title: string; backTo: string } {
    const ariaNgLocation = resolveAriaNgLocation(pathname);

    if (ariaNgLocation) {
        return ariaNgLocation;
    }

    const fieldMatch = matchPath('/settings/:type/:sub/:item/:field', pathname);

    if (fieldMatch) {
        const { type, sub, item, field } = fieldMatch.params;

        return {
            title: getRpcSettingFieldItem(field)?.label || 'Aria2 Settings',
            backTo: settingsBase + '/' + (type || '') + '/' + (sub || '') + '/' + (item || ''),
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
            title: resolveOptionTitle(type, sub, item) ?? 'Aria2 Settings',
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

        return { title: category?.label || 'Aria2 Settings', backTo: '/home' };
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
