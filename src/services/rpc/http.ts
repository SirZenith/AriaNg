import { ariaNgConstants } from '@/config/constants';
import { getCurrentRpcHttpMethod, getCurrentRpcRequestHeaders, getCurrentRpcUrl } from '@/services/settingService';
import { base64Encode } from '@/utils/common';
import type { RpcConnectionCallbacks, RpcRequestBody, RpcResultPayload, RpcTransport } from './types';

function getUrlWithQueryString(url: string, parameters: Record<string, unknown>): string {
    if (!url || url.length < 1) {
        return url;
    }

    let queryString = '';

    for (const key of Object.keys(parameters)) {
        let value = parameters[key];

        if (value === null || value === undefined) {
            continue;
        }

        if (queryString.length > 0) {
            queryString += '&';
        }

        if (typeof value === 'object') {
            value = encodeURIComponent(base64Encode(JSON.stringify(value)));
        }

        queryString += key + '=' + String(value);
    }

    if (queryString.length < 1) {
        return url;
    }

    return url + (url.indexOf('?') < 0 ? '?' : '&') + queryString;
}

export function createHttpTransport(): RpcTransport {
    const rpcUrl = getCurrentRpcUrl();
    const method = getCurrentRpcHttpMethod();
    const requestHeaders = getCurrentRpcRequestHeaders();

    return {
        async request(body: RpcRequestBody, callbacks: RpcConnectionCallbacks): Promise<RpcResultPayload> {
            let url = rpcUrl;
            let requestBody: string | undefined;
            const headers: Record<string, string> = {};

            if (method === 'GET') {
                url = getUrlWithQueryString(url, body as unknown as Record<string, unknown>);
            } else {
                requestBody = JSON.stringify(body);
                headers['Content-Type'] = 'application/json';
            }

            if (requestHeaders) {
                for (const line of requestHeaders.split('\n')) {
                    const items = line.split(':');

                    if (items.length !== 2) {
                        continue;
                    }

                    headers[items[0].trim()] = items[1].trim();
                }
            }

            try {
                const response = await fetch(url, {
                    method,
                    headers,
                    body: requestBody,
                    signal: AbortSignal.timeout(ariaNgConstants.httpRequestTimeout)
                });

                const data = (await response.json()) as RpcResultPayload;
                callbacks.onConnectionSuccess?.();

                return data;
            } catch {
                callbacks.onConnectionFailed?.();

                return {
                    id: body.id,
                    error: {
                        message: 'Cannot connect to aria2!'
                    }
                };
            }
        },
        reconnect(): void {
            // not implement
        },
        on(): void {
            // not implement
        }
    };
}
