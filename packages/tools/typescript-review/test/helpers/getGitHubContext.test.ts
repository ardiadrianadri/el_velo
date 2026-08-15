import { describe, expect, it } from 'vitest';

import { getGitHubContext } from '../../src/helpers/getGitHubContext.js';

describe('getGitHubContext', () => {
    it('creates context and rejects missing or invalid environment values', () => {
        process.env.GITHUB_REPOSITORY = 'owner/repository'; process.env.GITHUB_TOKEN = 'github-token'; process.env.PR_NUMBER = '42'; process.env.PR_HEAD_SHA = 'abc123';
        expect(getGitHubContext()).toMatchObject({ owner: 'owner', repo: 'repository', pullNumber: 42, headSha: 'abc123' });
        delete process.env.GITHUB_TOKEN;
        expect(() => getGitHubContext()).toThrow('required to publish');
        process.env.GITHUB_TOKEN = 'github-token'; process.env.GITHUB_REPOSITORY = 'invalid/repository/path';
        expect(() => getGitHubContext()).toThrow('Invalid GITHUB_REPOSITORY');
    });
});
