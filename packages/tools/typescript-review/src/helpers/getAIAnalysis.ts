import OpenAI from 'openai';

import { config, reviewSchema } from '../config.js';

export async function getAIAnalysis(instructions: string, diffInput: string): Promise<string> {
    const openai = new OpenAI({ apiKey: config.openAiApiKey });
    const response = await openai.responses.create({
        model: config.openAIModel,
        instructions,
        max_output_tokens: config.maxOutputTokens,
        input: [{ role: 'user', content: [{ type: 'input_text', text: diffInput }] }],
        text: { format: { type: 'json_schema', schema: reviewSchema, name: 'typescript-review' } },
    });
    return response.output_text;
}
