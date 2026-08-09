import { describe, expect, it } from 'vitest';

import { buildReviewBody, formatFinding, splitReviewIntoParts } from '../../src/helpers/reviewFormatting.js';
import { finding } from './fixtures.js';

describe('review formatting helpers', () => {
    it('formats reviews, including empty reviews and numbered parts', () => {
        expect(formatFinding(finding())).toContain('### MEDIUM: Example issue');
        expect(buildReviewBody({ findings: [] }, false, 1, 1)).toContain('No TypeScript issues');
        expect(buildReviewBody({ findings: [finding()] }, true, 2, 3)).toContain('(2/3)');
        expect(() => buildReviewBody({ findings: [finding({ description: 'x'.repeat(60_000) })] }, false, 1, 1)).toThrow('maximum length');
    });
    it('keeps complete findings together when splitting a review', () => {
        expect(splitReviewIntoParts({ findings: [] })).toEqual([{ findings: [] }]);
        const findings = Array.from({ length: 20 }, (_, index) => finding({ title: `Issue ${index}`, description: 'x'.repeat(4_000) }));
        const parts = splitReviewIntoParts({ findings });
        expect(parts.length).toBeGreaterThan(1);
        expect(parts.flatMap((part) => part.findings)).toEqual(findings);
        expect(() => splitReviewIntoParts({ findings: [finding({ description: 'x'.repeat(58_000) })] })).toThrow('maximum publishable');
    });
});
