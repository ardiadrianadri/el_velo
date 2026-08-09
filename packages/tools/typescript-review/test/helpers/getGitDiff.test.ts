import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ execAsync: vi.fn() }));
vi.mock('node:util', () => ({ promisify: vi.fn(() => mocks.execAsync) }));

import { getGitDiff } from '../../src/helpers/getGitDiff.js';
import { diff } from './fixtures.js';

describe('getGitDiff', () => {
    it('gets the TypeScript diff with configured Git arguments', async () => {
        mocks.execAsync.mockResolvedValue({ stdout: diff });
        await expect(getGitDiff()).resolves.toBe(diff);
        expect(mocks.execAsync).toHaveBeenCalledWith('git', expect.arrayContaining(['diff', '--no-ext-diff', '--find-renames', 'origin/develop...HEAD', '--']), expect.objectContaining({ maxBuffer: 1024 * 1024 }));
    });
    it('reports an oversized diff and rethrows other errors', async () => {
        mocks.execAsync.mockRejectedValueOnce(new RangeError('maxBuffer length exceeded'));
        await expect(getGitDiff()).rejects.toThrow('Git diff output exceeds');
        mocks.execAsync.mockRejectedValueOnce(new Error('git failed'));
        await expect(getGitDiff()).rejects.toThrow('git failed');
    });
});
