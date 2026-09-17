export interface Aria2ErrorInfo {
    descriptionKey?: string;
    hide?: boolean;
}

export const aria2Errors: Record<string, Aria2ErrorInfo> = {
    '1': { descriptionKey: 'error.unknown' },
    '2': { descriptionKey: 'error.operation.timeout' },
    '3': { descriptionKey: 'error.resource.notfound' },
    '4': { descriptionKey: 'error.resource.notfound.max-file-not-found' },
    '5': { descriptionKey: 'error.download.aborted.lowest-speed-limit' },
    '6': { descriptionKey: 'error.network.problem' },
    '8': { descriptionKey: 'error.resume.notsupported' },
    '9': { descriptionKey: 'error.space.notenough' },
    '10': { descriptionKey: 'error.piece.length.different' },
    '11': { descriptionKey: 'error.download.sametime' },
    '12': { descriptionKey: 'error.download.torrent.sametime' },
    '13': { descriptionKey: 'error.file.exists' },
    '14': { descriptionKey: 'error.file.rename.failed' },
    '15': { descriptionKey: 'error.file.open.failed' },
    '16': { descriptionKey: 'error.file.create.failed' },
    '17': { descriptionKey: 'error.io.error' },
    '18': { descriptionKey: 'error.directory.create.failed' },
    '19': { descriptionKey: 'error.name.resolution.failed' },
    '20': { descriptionKey: 'error.metalink.file.parse.failed' },
    '21': { descriptionKey: 'error.ftp.command.failed' },
    '22': { descriptionKey: 'error.http.response.header.bad' },
    '23': { descriptionKey: 'error.redirects.toomany' },
    '24': { descriptionKey: 'error.http.authorization.failed' },
    '25': { descriptionKey: 'error.bencoded.file.parse.failed' },
    '26': { descriptionKey: 'error.torrent.file.corrupted' },
    '27': { descriptionKey: 'error.magnet.uri.bad' },
    '28': { descriptionKey: 'error.option.bad' },
    '29': { descriptionKey: 'error.server.overload' },
    '30': { descriptionKey: 'error.rpc.request.parse.failed' },
    '32': { descriptionKey: 'error.checksum.failed' },
};
