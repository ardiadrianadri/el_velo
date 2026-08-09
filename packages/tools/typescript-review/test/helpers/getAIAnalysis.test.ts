import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ responsesCreate: vi.fn(), openAIConstructor: vi.fn() }));
vi.mock('openai', () => ({ default: vi.fn(function OpenAI(): { responses: { create: typeof mocks.responsesCreate } } { mocks.openAIConstructor(); return { responses: { create: mocks.responsesCreate } }; }) }));

import { getAIAnalysis } from '../../src/helpers/getAIAnalysis.js';
import { finding } from './fixtures.js';

describe('getAIAnalysis', () => {
    it('sends trusted instructions separately from the untrusted diff', async () => {
        mocks.responsesCreate.mockResolvedValue({ output_text: JSON.stringify({ findings: [finding()] }) });
        await expect(getAIAnalysis('trusted instructions', 'untrusted diff')).resolves.toBe(JSON.stringify({ findings: [finding()] }));
        expect(mocks.openAIConstructor).toHaveBeenCalledOnce();
        expect(mocks.responsesCreate).toHaveBeenCalledWith(expect.objectContaining({ instructions: 'trusted instructions', max_output_tokens: 16_000, input: [expect.objectContaining({ role: 'user' })] }));
    });
});
