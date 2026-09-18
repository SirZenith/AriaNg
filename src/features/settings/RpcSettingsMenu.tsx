import { ChevronRight, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getAllRpcSettings } from '@/services/settingService';

export default function RpcSettingsMenu() {
    const { t } = useTranslation();
    const settings = useMemo(() => getAllRpcSettings(), []);

    return (
        <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded bg-white shadow dark:bg-gray-800">
                {settings.map((setting, index) => (
                    <Link
                        key={index}
                        to={'/settings/aria2/ariang/rpc/' + index}
                        className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                    >
                        <span className="min-w-0 flex-1 truncate">
                            {setting.rpcAlias || setting.rpcHost + ':' + setting.rpcPort}
                        </span>
                        {setting.isDefault ? (
                            <span className="shrink-0 rounded bg-[#3c8dbc] px-1.5 py-0.5 text-[10px] text-white">
                                {t('Default')}
                            </span>
                        ) : null}
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    </Link>
                ))}
            </div>

            <Link
                to="/settings/aria2/ariang/rpc/new"
                className="flex items-center justify-center gap-1 rounded border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
            >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('Add New RPC Setting')}
            </Link>
        </div>
    );
}
