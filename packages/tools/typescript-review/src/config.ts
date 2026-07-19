import { join } from 'node:path';
import process from 'node:process';

const defaultProfilePath = './.github/ai-review/profiles/typescript-review.md';
const defaultOpenAIModel = 'gpt-5.6-terra';
const profilePath: string = process.env.TYPESCRIPT_REVIEW_PROFILE_PATH ?? defaultProfilePath;
const openAIModel: string = process.env.OPENAI_MODEL ?? defaultOpenAIModel;

export const config = {
    profilePath: join(process.cwd(), profilePath),
    branchToCompare: process.env.BRANCH_TO_COMPARE ?? 'develop',
    openAiApiKey: process.env.OPENAI_API_KEY,
    openAIModel: openAIModel,
};

export const reviewSchema = {
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
                        type: 'number',
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
