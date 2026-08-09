import { fileURLToPath } from 'node:url';

import { run } from './helpers/run.js';

export { addLineNumbersToDiff } from './helpers/addLineNumbersToDiff.js';
export { buildDiffInput } from './helpers/buildDiffInput.js';
export { buildReviewInstructions } from './helpers/buildReviewInstructions.js';
export { createReview } from './helpers/createReview.js';
export { decryptProfile } from './helpers/decryptProfile.js';
export { getAIAnalysis } from './helpers/getAIAnalysis.js';
export { getGitDiff } from './helpers/getGitDiff.js';
export { getGitHubContext } from './helpers/getGitHubContext.js';
export { getInlineComments, getReviewableDiffLines, normalizeFindingPath, toInlineComment } from './helpers/inlineComments.js';
export { main } from './helpers/main.js';
export { readProfile } from './helpers/readProfile.js';
export { buildReviewBody, formatFinding, splitReviewIntoParts } from './helpers/reviewFormatting.js';
export { run } from './helpers/run.js';
export { sortFindingsBySeverity } from './helpers/sortFindingsBySeverity.js';
export { writeReview } from './helpers/writeReview.js';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    void run();
}
