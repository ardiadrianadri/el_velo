import { join, isAbsolute } from 'node:path';
import process from 'node:process';
import type { Schema } from '@cfworker/json-schema';

const defaultProfilePath = './.github/ai-review/profiles/typescript-review.md';
const defaultOpenAIModel = 'gpt-5.6-terra';
const profilePath: string = process.env.TYPESCRIPT_REVIEW_PROFILE_PATH ?? defaultProfilePath;
const openAIModel: string = process.env.OPENAI_MODEL ?? defaultOpenAIModel;

const getMaxGitDiffBytes = (): number => {
    const defaultValue = 1024 * 1024;
    const bytes = Number(process.env.MAX_GIT_DIFF_BYTES ?? defaultValue);

    if (Number.isNaN(bytes)) {
        return defaultValue;
    }

    if (!Number.isFinite(bytes)) {
        return defaultValue;
    }

    if (!Number.isSafeInteger(bytes) || bytes <= 0) {
        return defaultValue;
    }

    return bytes;
};

export const config = {
    profilePath: isAbsolute(profilePath) ? profilePath : join(process.cwd(), profilePath),
    branchToCompare: process.env.BRANCH_TO_COMPARE ?? 'develop',
    openAiApiKey: process.env.OPENAI_API_KEY,
    openAIModel: openAIModel,
    maxGitDiffBytes: getMaxGitDiffBytes(), // 1 MB
};

export const reviewText = {
    marker: '<!-- typescript-review -->',
    title: 'Automated TypeScript review',
    noFindings: 'No TypeScript issues were found in the changes analysed.',
    inlineCommentsPublished: 'Findings have also been added as inline comments when GitHub could associate them with the diff.',
    inlineCommentsUnavailable: 'GitHub could not associate the findings with the diff; they are included in the summary below.',
    fileLabel: 'File',
    lineLabel: 'Line',
    recommendationLabel: 'Recommendation',
    truncated: '…result truncated…',
} as const;

export const reviewSchema: Schema = {
    type: 'object',
    properties: {
        findings: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    severity: {
                        type: 'string',
                        enum: ['critical', 'high', 'medium', 'low'],
                    },
                    file: {
                        type: 'string',
                    },
                    line: {
                        type: 'integer',
                        minimum: 1,
                    },
                    title: {
                        type: 'string',
                    },
                    description: {
                        type: 'string',
                    },
                    recommendation: {
                        type: 'string',
                    },
                },
                required: ['severity', 'file', 'line', 'title', 'description', 'recommendation'],
                additionalProperties: false,
            }
        }
    },
    required: ['findings'],
    additionalProperties: false,
};

export interface ReviewSchema {
    findings: {
        severity: 'critical' | 'high' | 'medium' | 'low';
        file: string;
        line: number;
        title: string;
        description: string;
        recommendation: string;
    }[];
};
