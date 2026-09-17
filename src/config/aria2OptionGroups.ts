export interface Aria2GlobalAvailableOptions {
    basicOptions: string[];
    httpFtpSFtpOptions: string[];
    httpOptions: string[];
    ftpSFtpOptions: string[];
    btOptions: string[];
    metalinkOptions: string[];
    rpcOptions: string[];
    advancedOptions: string[];
}

export interface Aria2TaskOptionKey {
    key: string;
    category: 'global' | 'http' | 'bittorrent';
    canShow?: string;
    canUpdate?: string;
    showHistory?: boolean;
    readonly?: boolean;
}

export const aria2GlobalAvailableOptions: Aria2GlobalAvailableOptions = {
        // Aria2 Setting Page Definition EXAMPLE:
        // 'category key': [
        //     'option key 1', 'option key 2', // more options if possible
        // ]
        basicOptions: [
            'dir', 'log', 'max-concurrent-downloads', 'check-integrity', 'continue'
        ],
        httpFtpSFtpOptions: [
            'all-proxy', 'all-proxy-user', 'all-proxy-passwd', 'connect-timeout', 'dry-run', 'lowest-speed-limit',
            'max-connection-per-server', 'max-file-not-found', 'max-tries', 'min-split-size', 'netrc-path', 'no-netrc',
            'no-proxy', 'proxy-method', 'remote-time', 'reuse-uri', 'retry-wait', 'server-stat-of',
            'server-stat-timeout', 'split', 'stream-piece-selector', 'timeout', 'uri-selector'
        ],
        httpOptions: [
            'check-certificate', 'http-accept-gzip', 'http-auth-challenge', 'http-no-cache', 'http-user',
            'http-passwd', 'http-proxy', 'http-proxy-user', 'http-proxy-passwd', 'https-proxy', 'https-proxy-user',
            'https-proxy-passwd', 'referer', 'enable-http-keep-alive', 'enable-http-pipelining', 'header',
            'save-cookies', 'use-head', 'user-agent'
        ],
        ftpSFtpOptions: [
            'ftp-user', 'ftp-passwd', 'ftp-pasv', 'ftp-proxy', 'ftp-proxy-user', 'ftp-proxy-passwd',
            'ftp-type', 'ftp-reuse-connection', 'ssh-host-key-md'
        ],
        btOptions: [
            'bt-detach-seed-only', 'bt-enable-hook-after-hash-check', 'bt-enable-lpd', 'bt-exclude-tracker',
            'bt-external-ip', 'bt-force-encryption', 'bt-hash-check-seed', 'bt-load-saved-metadata', 'bt-max-open-files', 'bt-max-peers',
            'bt-metadata-only', 'bt-min-crypto-level', 'bt-prioritize-piece', 'bt-remove-unselected-file',
            'bt-require-crypto', 'bt-request-peer-speed-limit', 'bt-save-metadata', 'bt-seed-unverified',
            'bt-stop-timeout', 'bt-tracker', 'bt-tracker-connect-timeout', 'bt-tracker-interval', 'bt-tracker-timeout',
            'dht-file-path', 'dht-file-path6', 'dht-listen-port', 'dht-message-timeout', 'enable-dht', 'enable-dht6',
            'enable-peer-exchange', 'follow-torrent', 'listen-port', 'max-overall-upload-limit', 'max-upload-limit',
            'peer-id-prefix', 'peer-agent', 'seed-ratio', 'seed-time'
        ],
        metalinkOptions: [
            'follow-metalink', 'metalink-base-uri', 'metalink-language', 'metalink-location', 'metalink-os',
            'metalink-version', 'metalink-preferred-protocol', 'metalink-enable-unique-protocol'
        ],
        rpcOptions: [
            'enable-rpc', 'pause-metadata', 'rpc-allow-origin-all', 'rpc-listen-all', 'rpc-listen-port',
            'rpc-max-request-size', 'rpc-save-upload-metadata', 'rpc-secure'
        ],
        advancedOptions: [
            'allow-overwrite', 'allow-piece-length-change', 'always-resume', 'async-dns', 'auto-file-renaming',
            'auto-save-interval', 'conditional-get', 'conf-path', 'console-log-level', 'content-disposition-default-utf8', 'daemon',
            'deferred-input', 'disable-ipv6', 'disk-cache', 'download-result', 'dscp', 'rlimit-nofile', 'enable-color', 'enable-mmap',
            'event-poll', 'file-allocation', 'force-save', 'save-not-found', 'hash-check-only', 'human-readable',
            'keep-unfinished-download-result', 'max-download-result', 'max-mmap-limit', 'max-resume-failure-tries',
            'min-tls-version', 'log-level', 'optimize-concurrent-downloads', 'piece-length', 'show-console-readout',
            'summary-interval', 'max-overall-download-limit', 'max-download-limit', 'no-conf',
            'no-file-allocation-limit', 'parameterized-uri', 'quiet', 'realtime-chunk-checksum', 'remove-control-file',
            'save-session', 'save-session-interval', 'socket-recv-buffer-size', 'stop', 'truncate-console-readout'
        ]
    };

export const aria2QuickSettingsAvailableOptions: { globalSpeedLimitOptions: string[] } = {
        globalSpeedLimitOptions: [
            'max-overall-download-limit', 'max-overall-upload-limit'
        ]
    };

export const aria2TaskAvailableOptions: { taskOptions: Aria2TaskOptionKey[] } = {
        // Aria2 Task Option Definition EXAMPLE:
        // {
        //     key: 'option key',
        //     category: 'global|http|bittorrent',
        //     [canShow: 'new|active|waiting|paused',] // possible to show in specific status, supporting multiple choice. if not set, always show
        //     [canUpdate: 'new|active|waiting|paused',] // possible to write in specific status, supporting multiple choice. if not set, always writable
        //     [showHistory: true|false,] // show history under the input box, only supporting "string" type. if not set, this is set to false
        // }
        taskOptions: [
            {
                key: 'dir',
                category: 'global',
                canUpdate: 'new',
                showHistory: true
            },
            {
                key: 'out',
                category: 'http',
                canUpdate: 'new'
            },
            {
                key: 'allow-overwrite',
                category: 'global',
                canShow: 'new'
            },
            {
                key: 'max-download-limit',
                category: 'global'
            },
            {
                key: 'max-upload-limit',
                category: 'bittorrent'
            },
            {
                key: 'split',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'min-split-size',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'max-connection-per-server',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'lowest-speed-limit',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'stream-piece-selector',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'http-user',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'http-passwd',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'all-proxy',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'all-proxy-user',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'all-proxy-passwd',
                category: 'http',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'checksum',
                category: 'http'
            },
            {
                key: 'referer',
                category: 'http',
                canUpdate: 'new'
            },
            {
                key: 'header',
                category: 'http',
                canUpdate: 'new'
            },
            {
                key: 'bt-max-peers',
                category: 'bittorrent'
            },
            {
                key: 'bt-request-peer-speed-limit',
                category: 'bittorrent'
            },
            {
                key: 'bt-remove-unselected-file',
                category: 'bittorrent'
            },
            {
                key: 'bt-stop-timeout',
                category: 'bittorrent',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'bt-tracker',
                category: 'bittorrent',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'seed-ratio',
                category: 'bittorrent',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'seed-time',
                category: 'bittorrent',
                canUpdate: 'new|waiting|paused'
            },
            {
                key: 'conditional-get',
                category: 'global',
                canShow: 'new'
            },
            {
                key: 'check-integrity',
                category: 'global'
            },
            {
                key: 'file-allocation',
                category: 'global',
                canShow: 'new'
            },
            {
                key: 'parameterized-uri',
                category: 'global',
                canShow: 'new'
            },
            {
                key: 'force-save',
                category: 'global'
            }
        ]
    };
