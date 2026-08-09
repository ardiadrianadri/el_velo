import { severityPriority } from '../config.js';
import type { ReviewSchema } from '../config.js';

export function sortFindingsBySeverity(review: ReviewSchema): ReviewSchema {
    return { ...review, findings: [...review.findings].sort((left, right) => severityPriority[left.severity] - severityPriority[right.severity]) };
}
