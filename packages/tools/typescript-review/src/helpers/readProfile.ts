import { constants } from 'node:fs';
import { lstat, open, readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import { config } from '../config.js';

function isWithinDirectory(directory: string, target: string): boolean {
    const pathFromDirectory = relative(directory, target);
    return (
        pathFromDirectory !== '' &&
        pathFromDirectory !== '..' &&
        !pathFromDirectory.startsWith(`..${sep}`) &&
        !isAbsolute(pathFromDirectory)
    );
}

async function readTrustedProfile(profilePath: string): Promise<string> {
    const runnerTemp = process.env.RUNNER_TEMP;
    const configuredProfilePath = process.env.TYPESCRIPT_REVIEW_PROFILE_PATH;
    if (!runnerTemp || !configuredProfilePath || resolve(configuredProfilePath) !== resolve(profilePath)) {
        throw new Error('The review profile must be configured inside RUNNER_TEMP in the CI review job.');
    }

    const runnerTempStats = await lstat(runnerTemp);
    if (runnerTempStats.isSymbolicLink() || !runnerTempStats.isDirectory()) {
        throw new Error('RUNNER_TEMP must be a real directory for the trusted review profile.');
    }

    const runnerTempRealPath = await realpath(runnerTemp);
    const profileLinkStats = await lstat(profilePath);
    if (profileLinkStats.isSymbolicLink()) {
        throw new Error('Symbolic links are not allowed for the trusted review profile.');
    }

    const profileRealPath = await realpath(profilePath);
    if (!isWithinDirectory(runnerTempRealPath, profileRealPath)) {
        throw new Error('The trusted review profile must resolve inside RUNNER_TEMP.');
    }

    const expectedStats = await stat(profileRealPath);
    if (!expectedStats.isFile()) {
        throw new Error('The trusted review profile must be a regular file.');
    }

    if (typeof constants.O_NOFOLLOW !== 'number') {
        throw new Error('The current platform cannot securely open the trusted review profile.');
    }

    const profileHandle = await open(profileRealPath, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        const openedStats = await profileHandle.stat();
        if (!openedStats.isFile() || openedStats.dev !== expectedStats.dev || openedStats.ino !== expectedStats.ino) {
            throw new Error('The trusted review profile changed while it was being opened.');
        }
        return await profileHandle.readFile('utf-8');
    } finally {
        await profileHandle.close();
    }
}

export function readProfile(profilePath = config.profilePath): Promise<string> {
    if (process.env.REQUIRE_TRUSTED_REVIEW_PROFILE === 'true') {
        return readTrustedProfile(profilePath);
    }
    return readFile(profilePath, 'utf-8');
}
