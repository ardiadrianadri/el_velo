import axios from 'axios';

import type { ReviewSchema } from '../config.js';
import { createReview } from './createReview.js';
import { getGitHubContext } from './getGitHubContext.js';
import { getInlineComments } from './inlineComments.js';
import { splitReviewIntoParts } from './reviewFormatting.js';

export async function writeReview(review: ReviewSchema, diff: string): Promise<void> {
    const context = getGitHubContext();
    const reviewParts = splitReviewIntoParts(review);
    for (const [index, reviewPart] of reviewParts.entries()) {
        const comments = getInlineComments(reviewPart, diff);
        try {
            await createReview(context, reviewPart, comments, index + 1, reviewParts.length);
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 422 && comments.length > 0) {
                await createReview(context, reviewPart, [], index + 1, reviewParts.length);
                continue;
            }
            throw error;
        }
    }
}
