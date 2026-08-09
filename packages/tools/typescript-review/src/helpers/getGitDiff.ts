import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { config } from '../config.js';

export async function getGitDiff(): Promise<string> {
    try {
        const execAsync = promisify(execFile);
        const { stdout } = await execAsync('git', ['diff', '--no-ext-diff', '--find-renames', `origin/${config.branchToCompare}...HEAD`, '--', '*.ts', '*.tsx', '*.mts', '*.cts'], { maxBuffer: config.maxGitDiffBytes });
        return stdout;
    } catch (error: unknown) {
        if (error instanceof RangeError && error.message.includes('maxBuffer')) {
            throw new Error(`Git diff output exceeds the maximum buffer size of ${config.maxGitDiffBytes} bytes. Consider increasing MAX_GIT_DIFF_BYTES.`);
        }
        throw error;
    }
}
