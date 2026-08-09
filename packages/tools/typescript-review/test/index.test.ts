import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ readFile: vi.fn(), execAsync: vi.fn(), responsesCreate: vi.fn(), axiosPost: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile: mocks.readFile }));
vi.mock('node:util', () => ({ promisify: vi.fn(() => mocks.execAsync) }));
vi.mock('openai', () => ({ default: vi.fn(function OpenAI(): { responses: { create: typeof mocks.responsesCreate } } { return { responses: { create: mocks.responsesCreate } }; }) }));
vi.mock('axios', () => ({ default: { post: mocks.axiosPost, isAxiosError: (error: unknown): boolean => Boolean((error as { isAxiosError?: boolean }).isAxiosError) } }));

import { main, run } from '../src/index.js';
import { diff, encryptProfile, finding } from './helpers/fixtures.js';

describe('main workflow', () => {
    it('validates, sorts, and publishes a complete model response', async () => {
        process.env.GITHUB_REPOSITORY = 'owner/repository'; process.env.GITHUB_TOKEN = 'github-token'; process.env.PR_NUMBER = '42';
        mocks.readFile.mockResolvedValue(encryptProfile('Trusted profile'));
        mocks.execAsync.mockResolvedValue({ stdout: diff });
        mocks.responsesCreate.mockResolvedValue({ output_text: JSON.stringify({ findings: [finding({ severity: 'low' }), finding({ severity: 'high' })] }) });
        mocks.axiosPost.mockResolvedValue({});
        await main();
        const requestBody = mocks.axiosPost.mock.calls[0][1].body as string;
        expect(requestBody.indexOf('### HIGH')).toBeLessThan(requestBody.indexOf('### LOW'));
    });
    it('logs failures when run as the command-line entrypoint', async () => {
        mocks.execAsync.mockRejectedValueOnce(new Error('git failed'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        process.exitCode = undefined;
        await run();
        expect(consoleError).toHaveBeenCalledWith('Error running TypeScript review:', expect.any(Error));
        expect(process.exitCode).toBe(1);
    });
    it('fails for invalid JSON and responses that do not satisfy the schema', async () => {
        process.env.GITHUB_REPOSITORY = 'owner/repository'; process.env.GITHUB_TOKEN = 'github-token'; process.env.PR_NUMBER = '42';
        mocks.readFile.mockResolvedValue(encryptProfile('Trusted profile'));
        mocks.execAsync.mockResolvedValue({ stdout: diff });
        mocks.responsesCreate.mockResolvedValueOnce({ output_text: '{invalid' });
        await expect(main()).rejects.toThrow(SyntaxError);
        mocks.responsesCreate.mockResolvedValueOnce({ output_text: JSON.stringify({ findings: [{ severity: 'invalid' }] }) });
        await expect(main()).rejects.toThrow('does not conform');
    });
});
