import { describe, expect, it } from 'vitest';

import { sortFindingsBySeverity } from '../../src/helpers/sortFindingsBySeverity.js';
import { finding } from './fixtures.js';

describe('sortFindingsBySeverity', () => {
    it('sorts by severity while retaining equal-severity order', () => {
        const review = sortFindingsBySeverity({ findings: [finding({ severity: 'low' }), finding({ severity: 'high' }), finding({ severity: 'medium' }), finding({ severity: 'critical' })] });
        expect(review.findings.map(({ severity }) => severity)).toEqual(['critical', 'high', 'medium', 'low']);
    });
});
