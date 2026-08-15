import { afterEach, beforeEach, vi } from 'vitest';

const environment = {
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_API_URL: process.env.GITHUB_API_URL,
    PR_NUMBER: process.env.PR_NUMBER,
    PR_HEAD_SHA: process.env.PR_HEAD_SHA,
    TYPESCRIPT_REVIEW_PROFILE_KEY: process.env.TYPESCRIPT_REVIEW_PROFILE_KEY,
};

beforeEach(() => {
    process.env.TYPESCRIPT_REVIEW_PROFILE_KEY = 'test-profile-key';
    vi.clearAllMocks();
});

afterEach(() => {
    for (const [key, value] of Object.entries(environment)) {
        if (value === undefined) {
            Reflect.deleteProperty(process.env, key);
        } else {
            process.env[key] = value;
        }
    }
    vi.restoreAllMocks();
});
