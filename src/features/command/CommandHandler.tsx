import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n from '@/i18n';
import { ariaNgDefaultOptions } from '@/config/constants';
import { aria2SettingService } from '@/services/aria2SettingService';
import { aria2TaskService } from '@/services/taskService';
import { notifyInPage } from '@/services/notification';
import { getOptions, setOptions } from '@/services/settingService';
import { base64UrlDecode } from '@/utils/common';

export default function CommandHandler() {
    const location = useLocation();
    const navigate = useNavigate();
    const handledRef = useRef('');

    useEffect(() => {
        const currentKey = location.pathname + location.search;

        if (handledRef.current === currentKey) {
            return;
        }

        handledRef.current = currentKey;

        const run = async () => {
            if (location.pathname.startsWith('/new/')) {
                const params = new URLSearchParams(location.search);
                const queryUrl = params.get('url');
                const queryUri = params.get('uri');
                let url: string;

                try {
                    if (queryUrl) {
                        url = base64UrlDecode(queryUrl);
                    } else if (queryUri) {
                        url = queryUri;
                    } else {
                        url = base64UrlDecode(location.pathname.substring('/new/'.length));
                    }
                } catch {
                    notifyInPage('Error', i18n.t('URL is not base64 encoded!'), { type: 'error', delay: false });
                    navigate('/downloading', { replace: true });
                    return;
                }

                const options: Record<string, string> = {};

                params.forEach((value, key) => {
                    if (aria2SettingService.isOptionKeyValid(key)) {
                        options[key] = value;
                    }
                });

                const paused = params.get('pause') === 'true';
                await aria2TaskService.newUriTask({ urls: [url], options }, paused);
                navigate(paused ? '/waiting' : '/downloading', { replace: true });
                return;
            }

            if (location.pathname.startsWith('/settings/rpc/set')) {
                const searchParams = new URLSearchParams(location.search);
                const rest = location.pathname.substring('/settings/rpc/set'.length).replace(/^\//, '');
                const parts = rest ? rest.split('/').map((part) => decodeURIComponent(part)) : [];
                const protocol = parts[0] || searchParams.get('protocol') || '';
                const host = parts[1] || searchParams.get('host') || '';
                const port = parts[2] || searchParams.get('port') || ariaNgDefaultOptions.rpcPort;
                const rpcInterface = parts[3] || searchParams.get('interface') || ariaNgDefaultOptions.rpcInterface;
                let secret = parts[4] || searchParams.get('secret') || '';

                if (!protocol || !['http', 'https', 'ws', 'wss'].includes(protocol)) {
                    notifyInPage('Error', i18n.t('Protocol is invalid!'), { type: 'error', delay: false });
                    navigate('/downloading', { replace: true });
                    return;
                }

                if (!host) {
                    notifyInPage('Error', i18n.t('RPC host cannot be empty!'), { type: 'error', delay: false });
                    navigate('/downloading', { replace: true });
                    return;
                }

                if (secret) {
                    try {
                        secret = base64UrlDecode(secret);
                    } catch {
                        notifyInPage('Error', i18n.t('RPC secret is not base64 encoded!'), { type: 'error', delay: false });
                        navigate('/downloading', { replace: true });
                        return;
                    }
                }

                const options = getOptions();

                setOptions({
                    ...options,
                    rpcAlias: '',
                    rpcHost: host,
                    rpcPort: port,
                    rpcInterface,
                    protocol,
                    httpMethod: ariaNgDefaultOptions.httpMethod,
                    rpcRequestHeaders: '',
                    secret
                });

                window.location.reload();
                return;
            }

            navigate('/downloading', { replace: true });
        };

        void run();
    }, [location, navigate]);

    return null;
}
