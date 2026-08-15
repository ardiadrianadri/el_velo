import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ axiosPost: vi.fn() }));
vi.mock('axios', () => ({ default: { post: mocks.axiosPost, isAxiosError: (error: unknown): boolean => Boolean((error as { isAxiosError?: boolean }).isAxiosError) } }));

import { createReview } from '../../src/helpers/createReview.js';
import { getGitHubContext } from '../../src/helpers/getGitHubContext.js';
import { writeReview } from '../../src/helpers/writeReview.js';
import { diff, finding } from './fixtures.js';

describe('review publication helpers', () => {
    it('publishes a review with the expected GitHub request', async () => {
        process.env.GITHUB_REPOSITORY = 'owner/repository'; process.env.GITHUB_TOKEN = 'github-token'; process.env.PR_NUMBER = '42';
        mocks.axiosPost.mockResolvedValue({});
        await createReview(getGitHubContext(), { findings: [finding()] }, [], 1, 1);
        expect(mocks.axiosPost).toHaveBeenCalledWith('https://api.github.com/repos/owner/repository/pulls/42/reviews', expect.objectContaining({ event: 'COMMENT', comments: [] }), expect.objectContaining({ timeout: 300_000 }));
    });
    it('falls back to a summary-only review after a GitHub inline-comment validation error', async () => {
        process.env.GITHUB_REPOSITORY = 'owner/repository'; process.env.GITHUB_TOKEN = 'github-token'; process.env.PR_NUMBER = '42';
        mocks.axiosPost.mockRejectedValueOnce({ isAxiosError: true, response: { status: 422 } }).mockResolvedValueOnce({});
        await writeReview({ findings: [finding()] }, diff);
        expect(mocks.axiosPost).toHaveBeenCalledTimes(2);
        expect(mocks.axiosPost.mock.calls[1][1].comments).toEqual([]);
    });
    it('rethrows other publication errors', async () => {
        process.env.GITHUB_REPOSITORY = 'owner/repository'; process.env.GITHUB_TOKEN = 'github-token'; process.env.PR_NUMBER = '42';
        mocks.axiosPost.mockRejectedValueOnce(new Error('network failed'));
        await expect(writeReview({ findings: [finding()] }, diff)).rejects.toThrow('network failed');
    });
});
