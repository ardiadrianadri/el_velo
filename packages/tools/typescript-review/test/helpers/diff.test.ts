import { describe, expect, it } from 'vitest';

import { addLineNumbersToDiff } from '../../src/helpers/addLineNumbersToDiff.js';
import { buildDiffInput } from '../../src/helpers/buildDiffInput.js';
import { diff } from './fixtures.js';

describe('diff helpers', () => {
    it('numbers added, removed, and context lines', () => {
        const numbered = addLineNumbersToDiff(diff);
        expect(numbered).toContain('context:1 |  const unchanged = true;');
        expect(numbered).toContain('old:2 | -const removed = true;');
        expect(numbered).toContain('added:2 | +const added = true;');
        expect(numbered).toContain('added:3 | +const second = true;');
    });
    it('wraps the diff as untrusted input', () => {
        expect(buildDiffInput(diff)).toContain('<untrusted-pull-request-diff>');
    });
});
