import { reviewText } from '../config.js';
import type { Finding, InlineComment, ReviewSchema } from '../config.js';

export function getReviewableDiffLines(diff: string): Map<string, Set<number>> {
    const reviewableLines = new Map<string, Set<number>>();
    let path: string | undefined;
    let newLine = 0;
    let remainingNewLines = 0;
    let isInsideHunk = false;
    for (const line of diff.split('\n')) {
        if (line.startsWith('diff --git ')) {
            path = undefined;
            isInsideHunk = false;
            remainingNewLines = 0;
            continue;
        }
        const hunkHeader = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
        if (hunkHeader) {
            newLine = Number(hunkHeader[1]);
            remainingNewLines = hunkHeader[2] ? Number(hunkHeader[2]) : 1;
            isInsideHunk = true;
            continue;
        }
        if (isInsideHunk) {
            if (!path || remainingNewLines === 0 || line === '\\ No newline at end of file') {
                continue;
            }
            if (line.startsWith('+') || line.startsWith(' ')) {
                const lines = reviewableLines.get(path) ?? new Set<number>();
                reviewableLines.set(path, lines);
                lines.add(newLine++);
                remainingNewLines--;
            }
            if (remainingNewLines === 0) {
                isInsideHunk = false;
            }
            continue;
        }
        if (line.startsWith('+++ ')) { const rightPath = line.slice(4); path = rightPath.startsWith('b/') ? rightPath.slice(2) : undefined; }
    }
    return reviewableLines;
}

export function normalizeFindingPath(path: string): string { return path.startsWith('b/') ? path.slice(2) : path; }

export function toInlineComment(finding: Finding, path: string): InlineComment {
    return { body: `**${finding.severity.toUpperCase()}: ${finding.title}**\n\n${finding.description}\n\n**${reviewText.recommendationLabel}:** ${finding.recommendation}`, line: finding.line, path, side: 'RIGHT' };
}
export function getInlineComments(review: ReviewSchema, diff: string): InlineComment[] {
    const reviewableLines = getReviewableDiffLines(diff);
    return review.findings.flatMap((finding) => {
        const path = normalizeFindingPath(finding.file);
        return reviewableLines.get(path)?.has(finding.line) ? [toInlineComment(finding, path)] : [];
    });
}
