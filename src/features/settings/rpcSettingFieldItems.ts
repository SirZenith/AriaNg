export interface RpcSettingFieldItem {
    key: 'protocol' | 'httpMethod';
    label: string;
    choices: string[];
}

export const rpcSettingFieldItems: RpcSettingFieldItem[] = [
    { key: 'protocol', label: 'Aria2 RPC Protocol', choices: ['http', 'https', 'ws', 'wss'] },
    { key: 'httpMethod', label: 'Aria2 RPC Http Request Method', choices: ['POST', 'GET'] },
];

export function getRpcSettingFieldItem(key: string | undefined): RpcSettingFieldItem | undefined {
    return rpcSettingFieldItems.find((item) => item.key === key);
}
