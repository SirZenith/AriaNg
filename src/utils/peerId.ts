// Ported from angular-bittorrent-peerid (MIT License).

export interface BittorrentClientInfo {
    client: string;
    version?: string;
}

type VersionFormatter = (version: string) => string;

const azStyleClients: Record<string, string> = {};
const azStyleClientVersions: Record<string, VersionFormatter | string> = {};
const shadowStyleClients: Record<string, string> = {};
const mainlineStyleClients: Record<string, string> = {};

interface SimpleClient {
    id: string;
    client: string;
    version?: string;
    position: number;
}

const customStyleClients: SimpleClient[] = [];

export function decodePercentEncodedString(value: string): string {
    if (!value) {
        return value;
    }

    let result = '';

    for (let i = 0; i < value.length; i++) {
        const ch = value.charAt(i);

        if (ch === '%' && i < value.length - 2) {
            const code = parseInt(value.substring(i + 1, i + 3), 16);

            if (!Number.isNaN(code)) {
                result += String.fromCharCode(code);
                i += 2;
                continue;
            }
        }

        result += ch;
    }

    return result;
}

export function toDisplayablePeerId(peerId: string): string {
    const decoded = decodePercentEncodedString(peerId);
    let result = '';

    for (let i = 0; i < decoded.length; i++) {
        const code = decoded.charCodeAt(i);

        if (code >= 32 && code !== 127) {
            result += decoded.charAt(i);
        }
    }

    return result;
}

function isDigit(value: string): boolean {
    const code = value.charCodeAt(0);
    return code >= '0'.charCodeAt(0) && code <= '9'.charCodeAt(0);
}

function isLetter(value: string): boolean {
    const code = value.toLowerCase().charCodeAt(0);
    return code >= 'a'.charCodeAt(0) && code <= 'z'.charCodeAt(0);
}

function isAlphaNumeric(value: string): boolean {
    return isDigit(value) || isLetter(value) || value === '.';
}

function decodeNumericValueOfByte(value: number, minDigits = 0): string {
    let result = String(value & 0xff);

    while (result.length < minDigits) {
        result = '0' + result;
    }

    return result;
}

function isAzStyle(peerId: string): boolean {
    if (peerId.charAt(0) !== '-') {
        return false;
    }

    if (peerId.charAt(7) === '-') {
        return true;
    }

    // Hack for FlashGet - it doesn't use the trailing dash.
    // Also, LH-ABC has strayed into "forgetting about the delimiter" territory.
    // BT Next Evolution seems to be in the same boat as well.
    // KTorrent 3 appears to use a dash rather than a final character.
    if (['FG', 'LH', 'NE', 'KT', 'SP'].indexOf(peerId.substring(1, 3)) >= 0) {
        return true;
    }

    return false;
}

function isShadowStyle(peerId: string): boolean {
    if (peerId.charAt(5) !== '-') {
        return false;
    }

    if (!isLetter(peerId.charAt(0))) {
        return false;
    }

    if (!(isDigit(peerId.charAt(1)) || peerId.charAt(1) === '-')) {
        return false;
    }

    let lastVersionNumberIndex = 4;

    for (; lastVersionNumberIndex > 0; lastVersionNumberIndex--) {
        if (peerId.charAt(lastVersionNumberIndex) !== '-') {
            break;
        }
    }

    for (let i = 1; i <= lastVersionNumberIndex; i++) {
        const c = peerId.charAt(i);

        if (c === '-') {
            return false;
        }

        if (isAlphaNumeric(c) === null) {
            return false;
        }
    }

    return true;
}

function isMainlineStyle(peerId: string): boolean {
    // One of the following styles will be used:
    //   Mx-y-z--
    //   Mx-yy-z-
    return (
        peerId.charAt(2) === '-' && peerId.charAt(7) === '-' && (peerId.charAt(4) === '-' || peerId.charAt(5) === '-')
    );
}

function isPossibleSpoofClient(peerId: string): boolean {
    return peerId.endsWith('UDP0') || peerId.endsWith('HTTPBT');
}

function getUtf8Data(value: string): number[] {
    const buffer: number[] = [];

    for (let i = 0; i < value.length; i++) {
        const ch = value.charCodeAt(i);

        if (ch < 128) {
            buffer.push(ch);
        } else if (ch < 2048) {
            buffer.push((ch >> 6) | 192, (ch & 63) | 128);
        } else {
            buffer.push((ch >> 12) | 224, ((ch >> 6) & 63) | 128, (ch & 63) | 128);
        }
    }

    return buffer;
}

function decodeBitSpiritClient(peerId: string, buffer: number[]): BittorrentClientInfo | null {
    if (peerId.substring(2, 4) !== 'BS') {
        return null;
    }

    let version = String(buffer[1]);

    if (version === '0') {
        version = '1';
    }

    return { client: 'BitSpirit', version };
}

function decodeBitCometClient(peerId: string, buffer: number[]): BittorrentClientInfo | null {
    let modName = '';

    if (peerId.startsWith('exbc')) {
        modName = '';
    } else if (peerId.startsWith('FUTB')) {
        modName = '(Solidox Mod)';
    } else if (peerId.startsWith('xUTB')) {
        modName = '(Mod 2)';
    } else {
        return null;
    }

    const isBitlord = peerId.substring(6, 10) === 'LORD';
    const clientName = isBitlord ? 'BitLord' : 'BitComet';
    const majVersion = decodeNumericValueOfByte(buffer[4]);
    const minVersionLength = isBitlord && majVersion !== '0' ? 1 : 2;

    return {
        client: clientName + (modName ? ' ' + modName : ''),
        version: majVersion + '.' + decodeNumericValueOfByte(buffer[5], minVersionLength),
    };
}

function identifyAwkwardClient(buffer: number[]): BittorrentClientInfo | null {
    let firstNonZeroIndex = 20;
    let i: number;

    for (i = 0; i < 20; ++i) {
        if (buffer[i] > 0) {
            firstNonZeroIndex = i;
            break;
        }
    }

    // Shareaza check
    if (firstNonZeroIndex === 0) {
        let isShareaza = true;

        for (i = 0; i < 16; ++i) {
            if (buffer[i] === 0) {
                isShareaza = false;
                break;
            }
        }

        if (isShareaza) {
            for (i = 16; i < 20; ++i) {
                if (buffer[i] !== (buffer[i % 16] ^ buffer[15 - (i % 16)])) {
                    isShareaza = false;
                    break;
                }
            }

            if (isShareaza) {
                return { client: 'Shareaza' };
            }
        }
    }

    if (firstNonZeroIndex === 9 && buffer[9] === 3 && buffer[10] === 3 && buffer[11] === 3) {
        return { client: 'I2PSnark' };
    }

    if (firstNonZeroIndex === 12 && buffer[12] === 97 && buffer[13] === 97) {
        return { client: 'Experimental', version: '3.2.1b2' };
    }

    if (firstNonZeroIndex === 12 && buffer[12] === 0 && buffer[13] === 0) {
        return { client: 'Experimental', version: '3.1' };
    }

    if (firstNonZeroIndex === 12) {
        return { client: 'Mainline' };
    }

    return null;
}

function verAzThreeDigits(v: string): string {
    return v[0] + '.' + v[1] + '.' + v[2];
}

function verAzDeluge(v: string): string {
    const alphabet = 'ABCDE';

    if (Number.isNaN(Number(v[2]))) {
        return v[0] + '.' + v[1] + '.1' + alphabet.indexOf(v[2]);
    }

    return v[0] + '.' + v[1] + '.' + v[2];
}

function verAzThreeDigitsPlusMnemonic(v: string): string {
    let mnemonic = v[3];

    if (mnemonic === 'B') {
        mnemonic = 'Beta';
    } else if (mnemonic === 'A') {
        mnemonic = 'Alpha';
    } else {
        mnemonic = '';
    }

    return v[0] + '.' + v[1] + '.' + v[2] + ' ' + mnemonic;
}

const verAzFourDigits: VersionFormatter = (v) => v[0] + '.' + v[1] + '.' + v[2] + '.' + v[3];
const verAzTwoMajTwoMin: VersionFormatter = (v) => v[0] + v[1] + '.' + v[2] + v[3];
const verAzSkipFirstOneMajTwoMin: VersionFormatter = (v) => v[1] + '.' + v[2] + v[3];
const verAzTransmissionStyle: VersionFormatter = (v) => {
    if (v[0] === '0' && v[1] === '0' && v[2] === '0') {
        return '0.' + v[3];
    } else if (v[0] === '0' && v[1] === '0') {
        return '0.' + v[2] + v[3];
    }

    return v[0] + '.' + v[1] + v[2] + (v[3] === 'Z' || v[3] === 'X' ? '+' : '');
};
const verAzWebtorrentStyle: VersionFormatter = (v) => {
    let version = '';

    if (v[0] === '0') {
        version += v[1] + '.';
    } else {
        version += '' + v[0] + v[1] + '.';
    }

    if (v[2] === '0') {
        version += v[3];
    } else {
        version += '' + v[2] + v[3];
    }

    return version;
};

const verNone = 'NO_VERSION';

function addAzStyle(id: string, client: string, version?: VersionFormatter | string): void {
    azStyleClients[id] = client;
    azStyleClientVersions[client] = version ?? verAzFourDigits;
}

function addShadowStyle(id: string, client: string): void {
    shadowStyleClients[id] = client;
}

function addMainlineStyle(id: string, client: string): void {
    mainlineStyleClients[id] = client;
}

function addSimpleClient(client: string, versionOrId: string, idOrPosition?: string | number, position?: number): void {
    let id: string;
    let version: string | undefined;
    let pos: number;

    if (typeof idOrPosition === 'number' || idOrPosition === undefined) {
        id = versionOrId;
        version = undefined;
        pos = (idOrPosition as number) || 0;
    } else {
        id = idOrPosition;
        version = versionOrId;
        pos = position || 0;
    }

    customStyleClients.push({ id, client, version, position: pos });
}

(function registerClients() {
    addAzStyle('A~', 'Ares', verAzThreeDigits);
    addAzStyle('AG', 'Ares', verAzThreeDigits);
    addAzStyle('AN', 'Ares', verAzFourDigits);
    addAzStyle('AR', 'Ares'); // Ares is more likely than ArcticTorrent
    addAzStyle('AV', 'Avicora');
    addAzStyle('AX', 'BitPump', verAzTwoMajTwoMin);
    addAzStyle('AT', 'Artemis');
    addAzStyle('AZ', 'Vuze', verAzFourDigits);
    addAzStyle('BB', 'BitBuddy', '1.234');
    addAzStyle('BC', 'BitComet', verAzSkipFirstOneMajTwoMin);
    addAzStyle('BE', 'BitTorrent SDK');
    addAzStyle('BF', 'BitFlu', verNone);
    addAzStyle('BG', 'BTG', verAzFourDigits);
    addAzStyle('bk', 'BitKitten (libtorrent)');
    addAzStyle('BR', 'BitRocket', '1.2(34)');
    addAzStyle('BS', 'BTSlave');
    addAzStyle('BT', 'BitTorrent', verAzThreeDigitsPlusMnemonic);
    addAzStyle('BW', 'BitWombat');
    addAzStyle('BX', 'BittorrentX');
    addAzStyle('CB', 'Shareaza Plus');
    addAzStyle('CD', 'Enhanced CTorrent', verAzTwoMajTwoMin);
    addAzStyle('CT', 'CTorrent', '1.2.34');
    addAzStyle('DP', 'Propogate Data Client');
    addAzStyle('DE', 'Deluge', verAzDeluge);
    addAzStyle('EB', 'EBit');
    addAzStyle('ES', 'Electric Sheep', verAzThreeDigits);
    addAzStyle('FC', 'FileCroc');
    addAzStyle('FG', 'FlashGet', verAzSkipFirstOneMajTwoMin);
    addAzStyle('FX', 'Freebox BitTorrent');
    addAzStyle('FT', 'FoxTorrent/RedSwoosh');
    addAzStyle('GR', 'GetRight', '1.2');
    addAzStyle('GS', 'GSTorrent'); // TODO: Format is v"abcd"
    addAzStyle('HL', 'Halite', verAzThreeDigits);
    addAzStyle('HN', 'Hydranode');
    addAzStyle('KG', 'KGet');
    addAzStyle('KT', 'KTorrent', '1.2.3=[RD].4');
    addAzStyle('LC', 'LeechCraft');
    addAzStyle('LH', 'LH-ABC');
    addAzStyle('LK', 'linkage', verAzThreeDigits);
    addAzStyle('LP', 'Lphant', verAzTwoMajTwoMin);
    addAzStyle('LT', 'libtorrent (Rasterbar)', '2.33.4');
    addAzStyle('lt', 'libTorrent (Rakshasa)', '2.33.4');
    addAzStyle('LW', 'LimeWire', verNone);
    addAzStyle('MO', 'MonoTorrent');
    addAzStyle('MP', 'MooPolice', verAzThreeDigits);
    addAzStyle('MR', 'Miro');
    addAzStyle('MT', 'MoonlightTorrent');
    addAzStyle('NE', 'BT Next Evolution', verAzThreeDigits);
    addAzStyle('NX', 'Net Transport');
    addAzStyle('OS', 'OneSwarm', verAzFourDigits);
    addAzStyle('OT', 'OmegaTorrent');
    addAzStyle('PC', 'CacheLogic', '12.3-4');
    addAzStyle('PT', 'Popcorn Time');
    addAzStyle('PD', 'Pando');
    addAzStyle('PE', 'PeerProject');
    addAzStyle('pX', 'pHoeniX');
    addAzStyle('qB', 'qBittorrent', verAzDeluge);
    addAzStyle('QD', 'qqdownload');
    addAzStyle('RT', 'Retriever');
    addAzStyle('RZ', 'RezTorrent');
    addAzStyle('S~', 'Shareaza alpha/beta');
    addAzStyle('SB', 'SwiftBit');
    addAzStyle('SD', '迅雷在线 (Xunlei)');
    addAzStyle('SG', 'GS Torrent', verAzFourDigits);
    addAzStyle('SN', 'ShareNET');
    addAzStyle('SP', 'BitSpirit', verAzThreeDigits);
    addAzStyle('SS', 'SwarmScope');
    addAzStyle('ST', 'SymTorrent', '2.34');
    addAzStyle('st', 'SharkTorrent');
    addAzStyle('SZ', 'Shareaza');
    addAzStyle('TG', 'Torrent GO');
    addAzStyle('TN', 'Torrent.NET');
    addAzStyle('TR', 'Transmission', verAzTransmissionStyle);
    addAzStyle('TS', 'TorrentStorm');
    addAzStyle('TT', 'TuoTu', verAzThreeDigits);
    addAzStyle('UL', 'uLeecher!');
    addAzStyle('UE', 'µTorrent Embedded', verAzThreeDigitsPlusMnemonic);
    addAzStyle('UT', 'µTorrent', verAzThreeDigitsPlusMnemonic);
    addAzStyle('UM', 'µTorrent Mac', verAzThreeDigitsPlusMnemonic);
    addAzStyle('UW', 'µTorrent Web', verAzThreeDigitsPlusMnemonic);
    addAzStyle('WD', 'WebTorrent Desktop', verAzWebtorrentStyle);
    addAzStyle('WT', 'Bitlet');
    addAzStyle('WW', 'WebTorrent', verAzWebtorrentStyle);
    addAzStyle('WY', 'FireTorrent'); // formerly Wyzo.
    addAzStyle('VG', '哇嘎 (Vagaa)', verAzFourDigits);
    addAzStyle('XL', '迅雷在线 (Xunlei)');
    addAzStyle('XT', 'XanTorrent');
    addAzStyle('XF', 'Xfplay', verAzTransmissionStyle);
    addAzStyle('XX', 'XTorrent', '1.2.34');
    addAzStyle('XC', 'XTorrent', '1.2.34');
    addAzStyle('ZT', 'ZipTorrent');
    addAzStyle('7T', 'aTorrent');
    addAzStyle('ZO', 'Zona', verAzFourDigits);
    addAzStyle('#@', 'Invalid PeerID');

    addShadowStyle('A', 'ABC');
    addShadowStyle('O', 'Osprey Permaseed');
    addShadowStyle('Q', 'BTQueue');
    addShadowStyle('R', 'Tribler');
    addShadowStyle('S', 'Shad0w');
    addShadowStyle('T', 'BitTornado');
    addShadowStyle('U', 'UPnP NAT');

    addMainlineStyle('M', 'Mainline');
    addMainlineStyle('Q', 'Queen Bee');

    // Simple clients with no version number.
    addSimpleClient('µTorrent', '1.7.0 RC', '-UT170-');
    addSimpleClient('Azureus', '1', 'Azureus');
    addSimpleClient('Azureus', '2.0.3.2', 'Azureus', 5);
    addSimpleClient('Aria', '2', '-aria2-');
    addSimpleClient('BitTorrent Plus!', 'II', 'PRC.P---');
    addSimpleClient('BitTorrent Plus!', 'P87.P---');
    addSimpleClient('BitTorrent Plus!', 'S587Plus');
    addSimpleClient('BitTyrant (Azureus Mod)', 'AZ2500BT');
    addSimpleClient('Blizzard Downloader', 'BLZ');
    addSimpleClient('BTGetit', 'BG', 10);
    addSimpleClient('BTugaXP', 'btuga');
    addSimpleClient('BTugaXP', 'BTuga', 5);
    addSimpleClient('BTugaXP', 'oernu');
    addSimpleClient('Deadman Walking', 'BTDWV-');
    addSimpleClient('Deadman', 'Deadman Walking-');
    addSimpleClient('External Webseed', 'Ext');
    addSimpleClient('G3 Torrent', '-G3');
    addSimpleClient('GreedBT', '2.7.1', '271-');
    addSimpleClient('Hurricane Electric', 'arclight');
    addSimpleClient('HTTP Seed', '-WS');
    addSimpleClient('JVtorrent', '10-------');
    addSimpleClient('Limewire', 'LIME');
    addSimpleClient('Martini Man', 'martini');
    addSimpleClient('Pando', 'Pando');
    addSimpleClient('PeerApp', 'PEERAPP');
    addSimpleClient('SimpleBT', 'btfans', 4);
    addSimpleClient('Swarmy', 'a00---0');
    addSimpleClient('Swarmy', 'a02---0');
    addSimpleClient('Teeweety', 'T00---0');
    addSimpleClient('TorrentTopia', '346-');
    addSimpleClient('XanTorrent', 'DansClient');
    addSimpleClient('MediaGet', '-MG1');
    addSimpleClient('MediaGet', '2.1', '-MG21');
    addSimpleClient('Amazon AWS S3', 'S3-');

    // Simple clients with custom version schemes
    addSimpleClient('BitTorrent DNA', 'DNA');
    addSimpleClient('Opera', 'OP'); // Pre build 10000 versions
    addSimpleClient('Opera', 'O'); // Post build 10000 versions
    addSimpleClient('Burst!', 'Mbrst');
    addSimpleClient('TurboBT', 'turbobt');
    addSimpleClient('BT Protocol Daemon', 'btpd');
    addSimpleClient('Plus!', 'Plus');
    addSimpleClient('XBT', 'XBT');
    addSimpleClient('BitsOnWheels', '-BOW');
    addSimpleClient('eXeem', 'eX');
    addSimpleClient('MLdonkey', '-ML');
    addSimpleClient('Bitlet', 'BitLet');
    addSimpleClient('AllPeers', 'AP');
    addSimpleClient('BTuga Revolution', 'BTM');
    addSimpleClient('Rufus', 'RS', 2);
    addSimpleClient('BitMagnet', 'BM', 2); // BitMagnet - predecessor to Rufus
    addSimpleClient('QVOD', 'QVOD');
    addSimpleClient('Top-BT', 'TB');
    addSimpleClient('Tixati', 'TIX');
    addSimpleClient('folx', '-FL');
    addSimpleClient('µTorrent Mac', '-UM');
    addSimpleClient('µTorrent', '-UT'); // UT 3.4+
})();

function getAzStyleClientVersion(client: string, peerId: string): string | null {
    const formatter = azStyleClientVersions[client];

    if (!formatter || typeof formatter !== 'function') {
        return null;
    }

    return formatter(peerId.substring(3, 7));
}

function getSimpleClient(peerId: string): SimpleClient | null {
    for (const client of customStyleClients) {
        if (peerId.startsWith(client.id, client.position)) {
            return client;
        }
    }

    return null;
}

export function parseBittorrentClient(peerId: string): BittorrentClientInfo {
    const buffer = getUtf8Data(peerId);

    if (isPossibleSpoofClient(peerId)) {
        const spoofClient = decodeBitSpiritClient(peerId, buffer) ?? decodeBitCometClient(peerId, buffer);

        return spoofClient ?? { client: 'BitSpirit?' };
    }

    // See if the client uses Az style identification
    if (isAzStyle(peerId)) {
        const clientName = azStyleClients[peerId.substring(1, 3)];

        if (clientName) {
            const version = getAzStyleClientVersion(clientName, peerId) ?? undefined;

            // Hack for fake ZipTorrent clients - there seems to be some clients
            // which use the same identifier, but they aren't valid ZipTorrent clients
            if (clientName.startsWith('ZipTorrent') && peerId.startsWith('bLAde', 8)) {
                return { client: 'Unknown [Fake: ZipTorrent]', version };
            }

            // BitTorrent 6.0 Beta currently misidentifies itself
            if (clientName === 'µTorrent' && version === '6.0 Beta') {
                return { client: 'Mainline', version: '6.0 Beta' };
            }

            // If it's the rakshasa libtorrent, then it's probably rTorrent
            if (clientName.startsWith('libTorrent (Rakshasa)')) {
                return { client: clientName + ' / rTorrent*', version };
            }

            return { client: clientName, version };
        }
    }

    // See if the client uses Shadow style identification
    if (isShadowStyle(peerId)) {
        const clientName = shadowStyleClients[peerId.substring(0, 1)];

        if (clientName) {
            return { client: clientName };
        }
    }

    // See if the client uses Mainline style identification
    if (isMainlineStyle(peerId)) {
        const clientName = mainlineStyleClients[peerId.substring(0, 1)];

        if (clientName) {
            return { client: clientName };
        }
    }

    // Check for BitSpirit / BitComet disregarding spoof mode
    const cometClient = decodeBitSpiritClient(peerId, buffer) ?? decodeBitCometClient(peerId, buffer);

    if (cometClient) {
        return cometClient;
    }

    // See if the client identifies itself using a particular substring
    const simpleClient = getSimpleClient(peerId);

    if (simpleClient) {
        return { client: simpleClient.client, version: simpleClient.version };
    }

    // See if client is known to be awkward / nonstandard
    const awkwardClient = identifyAwkwardClient(buffer);

    if (awkwardClient) {
        return awkwardClient;
    }

    return { client: 'unknown' };
}
