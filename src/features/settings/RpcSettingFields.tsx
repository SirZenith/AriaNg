import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { AriaNgRpcSetting } from '@/config/constants';

const inputClass = 'input';

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:items-center">
            <label className="text-sm font-medium">{label}</label>
            <div className="sm:col-span-2">{children}</div>
        </div>
    );
}

interface RpcSettingFieldsProps {
    setting: AriaNgRpcSetting;
    mobile?: boolean;
    rpcItem?: string;
    onChange: (field: keyof AriaNgRpcSetting, value: string) => void;
}

export default function RpcSettingFields({ setting, mobile = false, rpcItem = '', onChange }: RpcSettingFieldsProps) {
    const { t } = useTranslation();

    const renderChoiceField = (label: string, field: 'protocol' | 'httpMethod', value: string) => {
        if (!mobile) {
            return (
                <Field label={label}>
                    <select
                        className={inputClass}
                        value={value}
                        onChange={(event) => onChange(field, event.target.value)}
                    >
                        {field === 'protocol' ? (
                            <>
                                <option value="http">http</option>
                                <option value="https">https</option>
                                <option value="ws">ws</option>
                                <option value="wss">wss</option>
                            </>
                        ) : (
                            <>
                                <option value="POST">POST</option>
                                <option value="GET">GET</option>
                            </>
                        )}
                    </select>
                </Field>
            );
        }

        return (
            <Field label={label}>
                <Link
                    to={'/settings/aria2/ariang/rpc/' + rpcItem + '/' + field}
                    className="input flex items-center justify-between gap-2"
                >
                    <span>{value}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                </Link>
            </Field>
        );
    };

    return (
        <>
            <Field label={t('Aria2 RPC Alias')}>
                <input
                    className={inputClass}
                    value={setting.rpcAlias}
                    onChange={(event) => onChange('rpcAlias', event.target.value)}
                />
            </Field>
            {renderChoiceField(t('Aria2 RPC Protocol'), 'protocol', setting.protocol)}
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
            {renderChoiceField(t('Aria2 RPC Http Request Method'), 'httpMethod', setting.httpMethod)}
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
