import { describe, expect, it } from 'vitest';

import { getInlineComments, getReviewableDiffLines, normalizeFindingPath, toInlineComment } from '../../src/helpers/inlineComments.js';
import { diff, finding } from './fixtures.js';

describe('inline comment helpers', () => {
    it('finds reviewable right-side lines and produces inline comments', () => {
        expect(getReviewableDiffLines(diff).get('src/example.ts')).toEqual(new Set([1, 2, 3]));
        expect(normalizeFindingPath('b/src/example.ts')).toBe('src/example.ts');
        expect(normalizeFindingPath('src/example.ts')).toBe('src/example.ts');
        expect(toInlineComment(finding(), 'src/example.ts')).toMatchObject({ line: 2, path: 'src/example.ts', side: 'RIGHT' });
        expect(getInlineComments({ findings: [finding(), finding({ line: 99 })] }, diff)).toHaveLength(1);
        expect(getReviewableDiffLines('@@ -1 +1 @@\n+const noPath = true;')).toEqual(new Map());
    });
});
