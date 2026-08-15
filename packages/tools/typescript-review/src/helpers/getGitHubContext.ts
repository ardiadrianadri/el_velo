import type { GitHubContext } from '../config.js';

export function getGitHubContext(): GitHubContext {
    const repository = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    const pullNumber = Number(process.env.PR_NUMBER);
    const headSha = process.env.PR_HEAD_SHA;
    if (!repository || !token || !headSha || !Number.isSafeInteger(pullNumber) || pullNumber <= 0) {
        throw new Error('GITHUB_REPOSITORY, GITHUB_TOKEN, PR_HEAD_SHA and a valid PR_NUMBER are required to publish a review.');
    }
    const [owner, repo, ...rest] = repository.split('/');
    if (!owner || !repo || rest.length > 0) {
        throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository}`);
    }
    return { apiUrl: process.env.GITHUB_API_URL ?? 'https://api.github.com', owner, repo, pullNumber, headSha, token };
}
