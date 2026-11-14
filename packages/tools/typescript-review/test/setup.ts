import { afterEach, beforeEach, vi } from 'vitest';

const environment = {
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_API_URL: process.env.GITHUB_API_URL,
    PR_NUMBER: process.env.PR_NUMBER,
    TYPESCRIPT_REVIEW_PROFILE_KEY: process.env.TYPESCRIPT_REVIEW_PROFILE_KEY,
    REQUIRE_TRUSTED_REVIEW_PROFILE: process.env.REQUIRE_TRUSTED_REVIEW_PROFILE,
    REVIEW_BASE_SHA: process.env.REVIEW_BASE_SHA,
    REVIEW_HEAD_SHA: process.env.REVIEW_HEAD_SHA,
    TYPESCRIPT_REVIEW_PROFILE_FORMAT: process.env.TYPESCRIPT_REVIEW_PROFILE_FORMAT,
};

process.env.REQUIRE_TRUSTED_REVIEW_PROFILE = 'false';
process.env.TYPESCRIPT_REVIEW_PROFILE_FORMAT = 'plaintext';

beforeEach(() => {
    process.env.REQUIRE_TRUSTED_REVIEW_PROFILE = 'false';
    Reflect.deleteProperty(process.env, 'REVIEW_BASE_SHA');
    Reflect.deleteProperty(process.env, 'REVIEW_HEAD_SHA');
    process.env.TYPESCRIPT_REVIEW_PROFILE_FORMAT = 'plaintext';
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
