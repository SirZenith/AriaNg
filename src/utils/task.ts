import i18n from '@/i18n';
import { aria2Errors } from '@/config/aria2Errors';
import type { Aria2File, Aria2Peer, Aria2Task } from '@/types/aria2';
import { countArray, parseOrderType, orderByArray } from './common';

export function getFileName(file: Aria2File): string {
    if (!file) {
        return '';
    }

    let path = file.path;
    let needUrlDecode = false;

    if (!path && file.uris && file.uris.length > 0) {
        path = file.uris[0].uri;
        needUrlDecode = true;
    }

    if (!path) {
        return '';
    }

    const index = path.lastIndexOf('/');

    if (index <= 0 || index === path.length) {
        return path;
    }

    const fileNameAndQueryString = path.substring(index + 1);
    const queryStringStartPos = fileNameAndQueryString.indexOf('?');
    let fileName = fileNameAndQueryString;

    if (queryStringStartPos > 0) {
        fileName = fileNameAndQueryString.substring(0, queryStringStartPos);
    }

    if (needUrlDecode) {
        try {
            fileName = decodeURI(fileName);
        } catch {
            // keep original file name
        }
    }

    return fileName;
}

export function calculateDownloadRemainTime(remainBytes: number, downloadSpeed: number): number {
    if (downloadSpeed === 0) {
        return 0;
    }

    return remainBytes / downloadSpeed;
}

export function getTaskName(task: Aria2Task): { name: string; success: boolean } {
    let taskName = '';
    let success = true;

    if (task.bittorrent && task.bittorrent.info) {
        taskName = task.bittorrent.info.name || '';
    }

    if (!taskName && task.files && task.files.length > 0) {
        taskName = getFileName(task.files[0]);
    }

    if (!taskName) {
        taskName = i18n.t('Unknown');
        success = false;
    }

    return { name: taskName, success };
}

export function getTaskErrorDescription(task: Aria2Task): string {
    if (!task.errorCode) {
        return '';
    }

    const errorInfo = aria2Errors[task.errorCode];

    if (!errorInfo || !errorInfo.descriptionKey || errorInfo.hide) {
        return '';
    }

    return errorInfo.descriptionKey;
}

export function getPieceStatus(bitField: string | undefined, pieceCount: number): boolean[] {
    const pieces: boolean[] = [];

    for (let i = 0; i < pieceCount; i++) {
        pieces.push(false);
    }

    if (!bitField) {
        return pieces;
    }

    let pieceIndex = 0;

    for (let i = 0; i < bitField.length; i++) {
        const bitSet = parseInt(bitField[i], 16);

        for (let j = 1; j <= 4; j++) {
            const bit = 1 << (4 - j);
            pieces[pieceIndex++] = (bitSet & bit) === bit;

            if (pieceIndex >= pieceCount) {
                return pieces;
            }
        }
    }

    return pieces;
}

function toInt(value: unknown): number {
    return parseInt(String(value));
}

function getRelativePath(task: Aria2Task, file: Aria2File): string {
    const downloadPath = (task.dir || '').replace(/\\/g, '/');
    let relativePath = (file.path || '').replace(/\\/g, '/');

    if (downloadPath && relativePath.indexOf(downloadPath) === 0) {
        relativePath = relativePath.substring(downloadPath.length);
    }

    if (relativePath.charAt(0) === '/') {
        relativePath = relativePath.substring(1);
    }

    if (task.bittorrent?.mode === 'multi' && task.bittorrent.info?.name) {
        const bittorrentName = task.bittorrent.info.name;

        if (relativePath.indexOf(bittorrentName) === 0) {
            relativePath = relativePath.substring(bittorrentName.length);
        }
    }

    if (relativePath.charAt(0) === '/') {
        relativePath = relativePath.substring(1);
    }

    if (file.fileName && relativePath.lastIndexOf(file.fileName) + file.fileName.length === relativePath.length) {
        relativePath = relativePath.substring(0, relativePath.length - file.fileName.length);
    }

    if (relativePath.length > 1 && relativePath.charAt(relativePath.length - 1) === '/') {
        relativePath = relativePath.substring(0, relativePath.length - 1);
    }

    return relativePath;
}

function getDirectoryNode(
    path: string,
    allDirectories: Aria2File[],
    allDirectoryMap: Record<string, Aria2File>,
): Aria2File {
    const existing = allDirectoryMap[path];

    if (existing) {
        return existing;
    }

    let parentNode: Aria2File | null = null;
    let nodeName = path;

    if (path.length > 0) {
        let parentPath = '';
        const lastSeparatorIndex = path.lastIndexOf('/');

        if (lastSeparatorIndex > 0) {
            parentPath = path.substring(0, lastSeparatorIndex);
            nodeName = path.substring(lastSeparatorIndex + 1);
        }

        parentNode = getDirectoryNode(parentPath, allDirectories, allDirectoryMap);
    }

    const node: Aria2File = {
        index: '',
        path,
        length: 0,
        completedLength: 0,
        selected: true,
        isDir: true,
        nodePath: path,
        nodeName,
        relativePath: parentNode?.nodePath || '',
        level: parentNode ? Number(parentNode.level || 0) + 1 : 0,
        partialSelected: false,
        files: [],
        subDirs: [],
    };

    allDirectories.push(node);
    allDirectoryMap[path] = node;

    if (parentNode?.subDirs) {
        parentNode.subDirs.push(node);
    }

    return node;
}

function pushFileToDirectoryNode(
    file: Aria2File,
    allDirectories: Aria2File[],
    allDirectoryMap: Record<string, Aria2File>,
): Aria2File {
    const directoryNode = getDirectoryNode(file.relativePath || '', allDirectories, allDirectoryMap);

    directoryNode.files?.push(file);

    return directoryNode;
}

function fillAllNodes(node: Aria2File, allNodes: Aria2File[]): void {
    if (!node) {
        return;
    }

    let allSubNodesLength = 0;
    let selectedSubNodesCount = 0;
    let partialSelectedSubNodesCount = 0;
    const subDirs = node.subDirs || [];
    const files = node.files || [];

    for (const dirNode of subDirs) {
        allNodes.push(dirNode);
        fillAllNodes(dirNode, allNodes);
        allSubNodesLength += Number(dirNode.length || 0);
        selectedSubNodesCount += dirNode.selected ? 1 : 0;
        partialSelectedSubNodesCount += dirNode.partialSelected ? 1 : 0;
    }

    for (const fileNode of files) {
        allNodes.push(fileNode);
        allSubNodesLength += Number(fileNode.length || 0);
        selectedSubNodesCount += fileNode.selected ? 1 : 0;
    }

    node.length = allSubNodesLength;
    node.selected = selectedSubNodesCount > 0 && selectedSubNodesCount === subDirs.length + files.length;
    node.partialSelected =
        (selectedSubNodesCount > 0 && selectedSubNodesCount < subDirs.length + files.length) ||
        partialSelectedSubNodesCount > 0;
}

export function processDownloadTask(task: Aria2Task, addVirtualFileNode?: boolean): Aria2Task {
    if (!task) {
        return task;
    }

    const pieceStatus = getPieceStatus(task.bitfield, parseInt(task.numPieces || '0'));

    task.totalLength = toInt(task.totalLength);
    task.completedLength = toInt(task.completedLength);
    task.completePercent =
        Number(task.totalLength) > 0 ? (Number(task.completedLength) / Number(task.totalLength)) * 100 : 0;
    task.remainLength = Number(task.totalLength) - Number(task.completedLength);
    task.remainPercent = 100 - Number(task.completePercent);
    const uploadLength = task.uploadLength ? toInt(task.uploadLength) : 0;
    task.shareRatio = Number(task.completedLength) > 0 ? uploadLength / Number(task.completedLength) : 0;

    task.uploadSpeed = toInt(task.uploadSpeed);
    task.downloadSpeed = toInt(task.downloadSpeed);

    task.completedPieces = countArray(pieceStatus, true);
    task.idle = task.downloadSpeed === 0;
    task.remainTime = calculateDownloadRemainTime(Number(task.remainLength), Number(task.downloadSpeed));
    task.seeder = task.seeder === true || task.seeder === 'true';

    if (task.verifiedLength && task.totalLength) {
        task.verifiedPercent = Math.floor((toInt(task.verifiedLength) / Number(task.totalLength)) * 100);
    } else {
        task.verifiedPercent = undefined;
    }

    const taskNameResult = getTaskName(task);
    task.taskName = taskNameResult.name;
    task.hasTaskName = taskNameResult.success;
    task.errorDescription = getTaskErrorDescription(task);

    const useVirtualFileNode = !!addVirtualFileNode && !!task.bittorrent && task.bittorrent.mode === 'multi';

    if (task.files) {
        let selectedFileCount = 0;
        const allDirectories: Aria2File[] = [];
        const allDirectoryMap: Record<string, Aria2File> = {};

        for (const file of task.files) {
            file.index = toInt(file.index);
            file.fileName = getFileName(file);
            file.length = toInt(file.length);
            file.selected = file.selected === true || file.selected === 'true';
            file.completedLength = toInt(file.completedLength);
            file.completePercent =
                Number(file.length) > 0 ? (Number(file.completedLength) / Number(file.length)) * 100 : 0;

            if (useVirtualFileNode) {
                file.relativePath = getRelativePath(task, file);
                const dirNode = pushFileToDirectoryNode(file, allDirectories, allDirectoryMap);
                file.level = Number(dirNode.level || 0) + 1;
            }

            selectedFileCount += file.selected ? 1 : 0;
        }

        if (useVirtualFileNode && allDirectories.length > 1) {
            const allNodes: Aria2File[] = [];
            const rootNode = allDirectoryMap[''];

            if (rootNode) {
                fillAllNodes(rootNode, allNodes);
                task.files = allNodes;
                task.multiDir = true;
            }
        }

        task.selectedFileCount = selectedFileCount;
    }

    if (task.files && task.files.length === 1 && task.files[0].uris && task.files[0].uris[0]) {
        const firstUri = task.files[0].uris[0].uri;
        let isSingleUrlTask = true;

        for (const uriItem of task.files[0].uris) {
            if (uriItem.uri !== firstUri) {
                isSingleUrlTask = false;
                break;
            }
        }

        if (isSingleUrlTask) {
            task.singleUrl = firstUri;
        }
    }

    return task;
}

export function filterTask(task: Aria2Task, keyword: string): boolean {
    if (!task || typeof task.taskName !== 'string') {
        return false;
    }

    if (!keyword) {
        return true;
    }

    return task.taskName.toLowerCase().indexOf(keyword.toLowerCase()) >= 0;
}

export function getTaskStatusKey(task: Aria2Task, simplify?: boolean): string {
    if (!task) {
        return '';
    }

    if (task.status === 'active') {
        if (task.verifyIntegrityPending) {
            return 'Pending Verification';
        } else if (task.verifiedLength) {
            return task.verifiedPercent ? 'format.task.verifying-percent' : 'Verifying';
        } else if (task.seeder === true || task.seeder === 'true') {
            return 'Seeding';
        } else {
            return 'Downloading';
        }
    } else if (task.status === 'waiting') {
        return 'Waiting';
    } else if (task.status === 'paused') {
        return 'Paused';
    } else if (!simplify && task.status === 'complete') {
        return 'Completed';
    } else if (!simplify && task.status === 'error') {
        return task.errorCode ? 'format.task.error-occurred' : 'Error Occurred';
    } else if (!simplify && task.status === 'removed') {
        return 'Removed';
    }

    return '';
}

export function orderTasks<T extends Record<string, unknown>>(array: T[], type: string): T[] {
    if (!Array.isArray(array)) {
        return array;
    }

    const orderType = parseOrderType(type);

    if (orderType.type === 'name') {
        return orderByArray(array, ['taskName'], orderType.reverse);
    } else if (orderType.type === 'size') {
        return orderByArray(array, ['totalLength'], orderType.reverse);
    } else if (orderType.type === 'percent') {
        return orderByArray(array, ['completePercent'], orderType.reverse);
    } else if (orderType.type === 'remain') {
        return orderByArray(array, ['idle', 'remainTime', 'remainLength'], orderType.reverse);
    } else if (orderType.type === 'dspeed') {
        return orderByArray(array, ['downloadSpeed'], orderType.reverse);
    } else if (orderType.type === 'uspeed') {
        return orderByArray(array, ['uploadSpeed'], orderType.reverse);
    }

    return array;
}

export function isTaskRetryable(task: Aria2Task): boolean {
    return !!(task && task.status === 'error' && task.errorDescription && !task.bittorrent);
}

export function isStoppedTask(task: Aria2Task): boolean {
    return task.status === 'complete' || task.status === 'error' || task.status === 'removed';
}

export interface CombinedPiece {
    isCompleted: boolean;
    count: number;
}

export function getCombinedPieces(bitField: string | undefined, pieceCount: number): CombinedPiece[] {
    const pieces = getPieceStatus(bitField, pieceCount);
    const combinedPieces: CombinedPiece[] = [];

    for (const isCompleted of pieces) {
        const last = combinedPieces[combinedPieces.length - 1];

        if (last && last.isCompleted === isCompleted) {
            last.count++;
        } else {
            combinedPieces.push({ isCompleted, count: 1 });
        }
    }

    return combinedPieces;
}

export function processBtPeers(peers: Aria2Peer[], task: Aria2Task, includeLocalPeer?: boolean): Aria2Peer[] {
    if (!peers) {
        return peers;
    }

    const pieceCount = Number(task.numPieces || 0);
    const localPieces = getPieceStatus(task.bitfield, pieceCount);
    const localCompletedPieceCount = countArray(localPieces, true);
    const localTaskCompletedPercent = Number(task.completePercent || 0);

    for (const peer of peers) {
        const upstreamToSpeed = parseInt(String(peer.uploadSpeed));
        const downstreamFromSpeed = parseInt(String(peer.downloadSpeed));
        const completedPieces = getPieceStatus(peer.bitfield, pieceCount);
        const completedPieceCount = countArray(completedPieces, true);

        peer.name = peer.ip + ':' + peer.port;
        peer.completePercent = pieceCount > 0 ? (completedPieceCount / pieceCount) * 100 : 0;
        peer.downloadSpeed = upstreamToSpeed;
        peer.uploadSpeed = downstreamFromSpeed;
        peer.seeder = peer.seeder === true || peer.seeder === 'true';

        if (completedPieceCount === localCompletedPieceCount && peer.completePercent !== localTaskCompletedPercent) {
            peer.completePercent = localTaskCompletedPercent;
        }
    }

    if (includeLocalPeer) {
        peers.push({
            ip: '',
            port: '',
            name: '(local)',
            local: true,
            bitfield: task.bitfield,
            completePercent: localTaskCompletedPercent,
            downloadSpeed: Number(task.downloadSpeed || 0),
            uploadSpeed: Number(task.uploadSpeed || 0),
            seeder: task.seeder,
        });
    }

    return peers;
}

export function estimateHealthPercentFromPeers(task: Aria2Task, peers: Aria2Peer[]): number {
    const pieceCount = Number(task.numPieces || 0);

    if (!task || pieceCount < 1 || !peers || peers.length < 1) {
        return Number(task.completePercent || 0);
    }

    const totalPieces: number[] = new Array(pieceCount).fill(0);
    let maxCompletedPieceCount = 0;
    let maxCompletedPercent = Number(task.completePercent || 0);

    for (const peer of peers) {
        const peerPieces = getPieceStatus(peer.bitfield, pieceCount);
        let completedPieceCount = 0;

        for (let i = 0; i < peerPieces.length; i++) {
            const count = peerPieces[i] ? 1 : 0;
            totalPieces[i] += count;
            completedPieceCount += count;
        }

        if (completedPieceCount > maxCompletedPieceCount) {
            maxCompletedPieceCount = completedPieceCount;
            maxCompletedPercent = Number(peer.completePercent || 0);
        } else if (
            completedPieceCount === maxCompletedPieceCount &&
            Number(peer.completePercent || 0) > maxCompletedPercent
        ) {
            maxCompletedPercent = Number(peer.completePercent || 0);
        }
    }

    let totalCompletedPieceCount = 0;
    let hasFullPiece = true;

    while (hasFullPiece) {
        hasFullPiece = true;

        for (let i = 0; i < totalPieces.length; i++) {
            if (totalPieces[i] > 0) {
                totalCompletedPieceCount++;
                totalPieces[i]--;
            } else {
                hasFullPiece = false;
            }
        }
    }

    if (totalCompletedPieceCount <= maxCompletedPieceCount) {
        return maxCompletedPercent;
    }

    const healthPercent = (totalCompletedPieceCount / pieceCount) * 100;

    return healthPercent <= maxCompletedPercent ? maxCompletedPercent : healthPercent;
}

export function orderPeers(peers: Aria2Peer[], type: string): Aria2Peer[] {
    const orderType = parseOrderType(type);
    const records = peers as unknown as Record<string, unknown>[];

    if (orderType.type === 'name') {
        return orderByArray(records, ['name'], orderType.reverse) as unknown as Aria2Peer[];
    } else if (orderType.type === 'percent') {
        return orderByArray(records, ['completePercent'], orderType.reverse) as unknown as Aria2Peer[];
    } else if (orderType.type === 'dspeed') {
        return orderByArray(records, ['downloadSpeed'], orderType.reverse) as unknown as Aria2Peer[];
    } else if (orderType.type === 'uspeed') {
        return orderByArray(records, ['uploadSpeed'], orderType.reverse) as unknown as Aria2Peer[];
    }

    return peers;
}

export function orderFiles(files: Aria2File[], type: string): Aria2File[] {
    const orderType = parseOrderType(type);
    const records = files as unknown as Record<string, unknown>[];

    if (orderType.type === 'name') {
        return orderByArray(records, ['fileName'], orderType.reverse) as unknown as Aria2File[];
    } else if (orderType.type === 'percent') {
        return orderByArray(records, ['completePercent'], orderType.reverse) as unknown as Aria2File[];
    } else if (orderType.type === 'size') {
        return orderByArray(records, ['length'], orderType.reverse) as unknown as Aria2File[];
    }

    return files;
}
