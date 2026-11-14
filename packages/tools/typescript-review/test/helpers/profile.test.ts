import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile: mocks.readFile }));

import { buildReviewInstructions } from '../../src/helpers/buildReviewInstructions.js';
import { readProfile } from '../../src/helpers/readProfile.js';

describe('profile helpers', () => {
    it('uses the plaintext profile directly as trusted review instructions', async () => {
        mocks.readFile.mockResolvedValue('Trusted TypeScript review profile');
        await expect(readProfile()).resolves.toBe('Trusted TypeScript review profile');
        await expect(buildReviewInstructions()).resolves.toBe('Trusted TypeScript review profile');
    });
});
