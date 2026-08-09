import { Validator } from '@cfworker/json-schema';

import { reviewSchema } from '../config.js';
import type { ReviewSchema } from '../config.js';
import { buildDiffInput } from './buildDiffInput.js';
import { buildReviewInstructions } from './buildReviewInstructions.js';
import { getAIAnalysis } from './getAIAnalysis.js';
import { getGitDiff } from './getGitDiff.js';
import { sortFindingsBySeverity } from './sortFindingsBySeverity.js';
import { writeReview } from './writeReview.js';

export async function main(): Promise<void> {
    const validator = new Validator(reviewSchema);
    const diff = await getGitDiff();
    const instructions = await buildReviewInstructions();
    const response = await getAIAnalysis(instructions, buildDiffInput(diff));
    const review = JSON.parse(response) as ReviewSchema;
    const validationResult = validator.validate(review);
    if (!validationResult.valid) {
        console.error('Invalid review schema:', validationResult.errors);
        throw new Error('The AI response does not conform to the expected review schema.');
    }
    await writeReview(sortFindingsBySeverity(review), diff);
}
