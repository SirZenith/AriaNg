import { useTranslation } from 'react-i18next';
import type { AriaNgRpcSetting } from '@/config/constants';

const inputClass =
    'w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:items-center">
            <label className="text-sm font-medium">{label}</label>
            <div className="sm:col-span-2">{children}</div>
        </div>
    );
}

interface RpcSettingFieldsProps {
    setting: AriaNgRpcSetting;
    onChange: (field: keyof AriaNgRpcSetting, value: string) => void;
}

export default function RpcSettingFields({ setting, onChange }: RpcSettingFieldsProps) {
    const { t } = useTranslation();

    return (
        <>
            <Field label={t('Aria2 RPC Alias')}>
                <input
                    className={inputClass}
                    value={setting.rpcAlias}
                    onChange={(event) => onChange('rpcAlias', event.target.value)}
                />
            </Field>
            <Field label={t('Aria2 RPC Protocol')}>
                <select
                    className={inputClass}
                    value={setting.protocol}
                    onChange={(event) => onChange('protocol', event.target.value)}
                >
                    <option value="http">http</option>
                    <option value="https">https</option>
                    <option value="ws">ws</option>
                    <option value="wss">wss</option>
                </select>
            </Field>
            <Field label={t('Aria2 RPC Address')}>
                <input
                    className={inputClass}
                    value={setting.rpcHost}
                    onChange={(event) => onChange('rpcHost', event.target.value)}
                />
            </Field>
            <Field label={t('Aria2 RPC Port')}>
                <input
                    className={inputClass}
                    value={setting.rpcPort}
                    onChange={(event) => onChange('rpcPort', event.target.value)}
                />
            </Field>
            <Field label={t('Aria2 RPC Interface')}>
                <input
                    className={inputClass}
                    value={setting.rpcInterface}
                    onChange={(event) => onChange('rpcInterface', event.target.value)}
                />
            </Field>
            <Field label={t('Aria2 RPC Secret Token')}>
                <input
                    className={inputClass}
                    value={setting.secret}
                    onChange={(event) => onChange('secret', event.target.value)}
                />
            </Field>
            <Field label={t('Aria2 RPC Http Request Method')}>
                <select
                    className={inputClass}
                    value={setting.httpMethod}
                    onChange={(event) => onChange('httpMethod', event.target.value)}
                >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                </select>
            </Field>
            <Field label={t('Aria2 RPC Request Headers')}>
                <textarea
                    className={inputClass + ' h-20'}
                    value={setting.rpcRequestHeaders}
                    onChange={(event) => onChange('rpcRequestHeaders', event.target.value)}
                />
            </Field>
        </>
    );
}
