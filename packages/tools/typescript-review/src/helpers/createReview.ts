import axios from 'axios';

import type { GitHubContext, InlineComment, ReviewSchema } from '../config.js';
import { buildReviewBody } from './reviewFormatting.js';

export async function createReview(context: GitHubContext, review: ReviewSchema, comments: InlineComment[], partNumber: number, partCount: number): Promise<void> {
    const url = new URL(`repos/${encodeURIComponent(context.owner)}/${encodeURIComponent(context.repo)}/pulls/${context.pullNumber}/reviews`, `${context.apiUrl.replace(/\/$/, '')}/`);
    await axios.post(url.toString(), {
        body: buildReviewBody(review, comments.length > 0, partNumber, partCount),
        comments,
        event: 'COMMENT',
    }, {
        timeout: 5 * 60 * 1000,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${context.token}`,
            'User-Agent': 'el-velo-typescript-review',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
}
