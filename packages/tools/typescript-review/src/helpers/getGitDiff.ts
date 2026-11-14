import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { config } from '../config.js';

const typescriptPathspecs = [
    ':(top,glob)**/*.ts',
    ':(top,glob)**/*.tsx',
    ':(top,glob)**/*.mts',
    ':(top,glob)**/*.cts',
];

export async function getGitDiff(): Promise<string> {
    try {
        const execAsync = promisify(execFile);
        const baseRef = config.reviewBaseSha ?? `origin/${config.branchToCompare}`;
        const headRef = config.reviewHeadSha ?? 'HEAD';
        const { stdout } = await execAsync('git', ['diff', '--no-ext-diff', '--no-textconv', '--find-renames', `${baseRef}...${headRef}`, '--', ...typescriptPathspecs], { maxBuffer: config.maxGitDiffBytes });
        return stdout;
    } catch (error: unknown) {
        if (error instanceof RangeError && error.message.includes('maxBuffer')) {
            throw new Error(`Git diff output exceeds the maximum buffer size of ${config.maxGitDiffBytes} bytes. Consider increasing MAX_GIT_DIFF_BYTES.`);
        }
        throw error;
    }
}
