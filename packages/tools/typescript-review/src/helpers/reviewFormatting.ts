import { maxFindingsLengthPerReview, maxReviewBodyLength, reviewText } from '../config.js';
import type { Finding, ReviewSchema } from '../config.js';

export function formatFinding(finding: Finding): string {
    return `### ${finding.severity.toUpperCase()}: ${finding.title}\n\n**${reviewText.fileLabel}:** \`${finding.file}\`<br>\n**${reviewText.lineLabel}:** ${finding.line}\n\n${finding.description}\n\n**${reviewText.recommendationLabel}:** ${finding.recommendation}`;
}

export function buildReviewBody(review: ReviewSchema, inlineCommentsPublished: boolean, partNumber: number, partCount: number): string {
    const findings = review.findings.length === 0 ? reviewText.noFindings : review.findings.map(formatFinding).join('\n\n---\n\n');
    const inlineNote = inlineCommentsPublished ? reviewText.inlineCommentsPublished : reviewText.inlineCommentsUnavailable;
    const partTitle = partCount > 1 ? ` (${partNumber}/${partCount})` : '';
    const body = `${reviewText.marker}\n## ${reviewText.title}${partTitle}\n\n${inlineNote}\n\n${findings}`;
    if (body.length > maxReviewBodyLength) {
        throw new Error('A review body exceeds GitHub\'s maximum length.');
    }
    return body;
}

export function splitReviewIntoParts(review: ReviewSchema): ReviewSchema[] {
    if (review.findings.length === 0) {
        return [review];
    }
    const parts: Finding[][] = [];
    let currentPart: Finding[] = [];
    let currentPartLength = 0;
    for (const finding of review.findings) {
        const separatorLength = currentPart.length === 0 ? 0 : '\n\n---\n\n'.length;
        const findingLength = formatFinding(finding).length + separatorLength;
        if (findingLength > maxFindingsLengthPerReview) {
            throw new Error('A finding exceeds the maximum publishable review size.');
        }
        if (currentPartLength + findingLength > maxFindingsLengthPerReview) {
            parts.push(currentPart);
            currentPart = [];
            currentPartLength = 0;
        }
        currentPart.push(finding);
        currentPartLength += formatFinding(finding).length + (currentPart.length === 1 ? 0 : '\n\n---\n\n'.length);
    }
    parts.push(currentPart);
    return parts.map((findings) => ({ findings }));
}
