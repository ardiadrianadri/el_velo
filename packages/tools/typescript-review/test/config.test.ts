import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnvironment = { ...process.env };

interface ReviewConfig {
    branchToCompare: string;
    maxGitDiffBytes: number;
    maxOutputTokens: number;
    openAIModel: string;
    profilePath: string;
}

async function loadConfig(environment: Record<string, string | undefined>): Promise<{ config: ReviewConfig }> {
    vi.resetModules();
    for (const key of ['TYPESCRIPT_REVIEW_PROFILE_PATH', 'OPENAI_MODEL', 'MAX_GIT_DIFF_BYTES', 'BRANCH_TO_COMPARE']) {
        Reflect.deleteProperty(process.env, key);
    }
    Object.assign(process.env, environment);
    return import('../src/config.js');
}

afterEach(() => {
    process.env = { ...originalEnvironment };
});

describe('typescript-review configuration', () => {
    it('uses safe defaults', async () => {
        const { config } = await loadConfig({});

        expect(config.branchToCompare).toBe('develop');
        expect(config.openAIModel).toBe('gpt-5.6-terra');
        expect(config.maxGitDiffBytes).toBe(1024 * 1024);
        expect(config.maxOutputTokens).toBe(16_000);
        expect(config.profilePath).toContain('.github/ai-review/profiles/typescript-review.md');
    });

    it('uses configured values and preserves an absolute profile path', async () => {
        const { config } = await loadConfig({
            TYPESCRIPT_REVIEW_PROFILE_PATH: '/tmp/profile.enc',
            OPENAI_MODEL: 'test-model',
            BRANCH_TO_COMPARE: 'main',
            MAX_GIT_DIFF_BYTES: '42',
        });

        expect(config).toMatchObject({
            profilePath: '/tmp/profile.enc',
            openAIModel: 'test-model',
            branchToCompare: 'main',
            maxGitDiffBytes: 42,
        });
    });

    it.each(['not-a-number', 'Infinity', '0', '-1', '1.5'])('falls back for invalid MAX_GIT_DIFF_BYTES: %s', async (value) => {
        const { config } = await loadConfig({ MAX_GIT_DIFF_BYTES: value });
        expect(config.maxGitDiffBytes).toBe(1024 * 1024);
    });

    it('resolves a relative profile path from the working directory', async () => {
        const { config } = await loadConfig({ TYPESCRIPT_REVIEW_PROFILE_PATH: 'profiles/review.enc' });
        expect(config.profilePath).toBe(`${process.cwd()}/profiles/review.enc`);
    });
});
