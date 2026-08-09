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
    profileEncryptionKey: process.env.TYPESCRIPT_REVIEW_PROFILE_KEY,
    openAIModel: openAIModel,
    maxGitDiffBytes: getMaxGitDiffBytes(), // 1 MB
    maxOutputTokens: 16_000,
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
                        maxLength: 512,
                    },
                    line: {
                        type: 'integer',
                        minimum: 1,
                    },
                    title: {
                        type: 'string',
                        maxLength: 300,
                    },
                    description: {
                        type: 'string',
                        maxLength: 4_000,
                    },
                    recommendation: {
                        type: 'string',
                        maxLength: 2_000,
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
