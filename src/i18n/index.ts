import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ariaNgLanguages } from '@/config/languages';
import { ariaNgConstants } from '@/config/constants';
import en from '@/locales/en/translation.json';

const localeLoaders = import.meta.glob<{ default: Record<string, string> }>([
    '../locales/*/translation.json',
    '!../locales/en/translation.json',
]);

export function getLanguageNameFromAlias(alias: string): string | null {
    for (const langName of Object.keys(ariaNgLanguages)) {
        if (langName.toLowerCase() === alias.toLowerCase()) {
            return langName;
        }

        const aliases = ariaNgLanguages[langName].aliases;

        if (!aliases) {
            continue;
        }

        for (const item of aliases) {
            if (item.toLowerCase() === alias.toLowerCase()) {
                return langName;
            }
        }
    }

    return null;
}

export function getDefaultLanguage(): string {
    const browserLang = navigator.language || (navigator as { browserLanguage?: string }).browserLanguage;

    if (!browserLang) {
        return ariaNgConstants.defaultLanguage;
    }

    let lang = browserLang.replace(/-/g, '_');

    if (!ariaNgLanguages[lang]) {
        const aliasName = getLanguageNameFromAlias(lang);

        if (aliasName) {
            lang = aliasName;
        }
    }

    if (!ariaNgLanguages[lang] && lang.split('_').length > 1) {
        const parts = lang.split('_');
        lang = parts[0] + '_' + parts[1];

        if (!ariaNgLanguages[lang]) {
            const aliasName = getLanguageNameFromAlias(lang);

            if (aliasName) {
                lang = aliasName;
            }
        }

        if (!ariaNgLanguages[lang]) {
            lang = parts[0];
            const aliasName = getLanguageNameFromAlias(lang);

            if (aliasName) {
                lang = aliasName;
            }
        }
    }

    if (!ariaNgLanguages[lang]) {
        return ariaNgConstants.defaultLanguage;
    }

    return lang;
}

export async function ensureLanguageResources(lang: string): Promise<void> {
    if (!i18n.hasResourceBundle(lang, 'translation')) {
        const loader = localeLoaders[`../locales/${lang}/translation.json`];

        if (loader) {
            const module = await loader();
            i18n.addResourceBundle(lang, 'translation', module.default, true, true);
        }
    }

    applyExtraTranslations(lang);
}

const extraTranslations: Record<string, Record<string, string>> = {
    zh_Hans: {
        Reset: '重置',
        System: '跟随系统',
        Shutdown: '关闭 aria2',
        'Download Links': '下载链接',
        'There is no task': '暂无任务',
        'Connection Status': '连接状态',
        Protocol: '协议',
        'RPC Host': 'RPC 地址',
        'RPC Port': 'RPC 端口',
        'RPC Interface': 'RPC 接口',
        'RPC Secret': 'RPC 密钥',
        'RPC Request Headers': 'RPC 请求头',
        'HTTP Method': 'HTTP 方法',
        'Please enter at least one valid url': '请输入至少一个有效的下载地址',
        'Please select a torrent file': '请选择种子文件',
        'Please select a metalink file': '请选择 Metalink 文件',
        'Cannot read file': '无法读取文件',
        'Save Session Succeeded': '保存会话成功',
        'Completed Length': '已完成',
        'Upload Length': '已上传',
        Health: '健康度',
        'BitTorrent Name': '种子名称',
        Comment: '注释',
        'Creation Date': '创建时间',
        'BitTorrent Mode': '种子模式',
        'There is no file': '暂无文件',
        'There is no peer': '暂无 Peer',
        'By Address': '按地址排序',
        'Changes take effect immediately.': '修改后立即生效.',
        Logs: '日志',
        Descending: '倒序',
        Ascending: '正序',
        Remove: '删除',
        Apply: '应用',
        'Select Files by Type': '按类型选择文件',
        'Aria2 RPC Port': 'RPC 端口',
        'Aria2 RPC Interface': 'RPC 接口',
        'Up to 1024 Pieces': '最多 1024 个分片',
        'Up to 10240 Pieces': '最多 10240 个分片',
        'Up to 102400 Pieces': '最多 102400 个分片',
        'Are you sure you want to remove the selected tasks?': '确定要删除选中的任务吗?',
        'There is no url in selected tasks': '选中的任务中没有下载链接',
        'There is no info hash in selected tasks': '选中的任务中没有 Info Hash',
    },
};

function applyExtraTranslations(lang: string): void {
    const extra = extraTranslations[lang];

    if (extra) {
        i18n.addResourceBundle(lang, 'translation', extra, true, true);
    }
}

void i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en as Record<string, string> },
    },
    lng: 'en',
    fallbackLng: 'en',
    load: 'currentOnly',
    lowerCaseLng: false,
    cleanCode: false,
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
