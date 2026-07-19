import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import OpenAI from 'openai';
import axios from 'axios';

import { config, reviewSchema } from './config.js';
import type { ReviewSchema } from './config.js';

async function readProfile(): Promise<string> {
    return readFile(config.profilePath, 'utf-8');
}

const maxReviewBodyLength = 60_000;

interface GitHubContext {
    apiUrl: string;
    owner: string;
    repo: string;
    pullNumber: number;
    token: string;
}

type Finding = ReviewSchema['findings'][number];

/**
 * Adds source line numbers to the code lines in a unified diff.
 *
 * Lines from the new version use the `new:` prefix, which is the line number
 * required by GitHub when publishing a comment with `side: 'RIGHT'`.
 */
function addLineNumbersToDiff(diff: string): string {
    let oldLine = 0;
    let newLine = 0;
    let isInsideHunk = false;

    return diff.split('\n').map((line) => {
        if (line.startsWith('diff --git ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
            isInsideHunk = false;
            return line;
        }

        const hunkHeader = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
        if (hunkHeader) {
            oldLine = Number(hunkHeader[1]);
            newLine = Number(hunkHeader[2]);
            isInsideHunk = true;
            return line;
        }

        if (!isInsideHunk || line === '\\ No newline at end of file') {
            return line;
        }

        if (line.startsWith('+')) {
            return `new:${newLine++} | ${line}`;
        }

        if (line.startsWith('-')) {
            return `old:${oldLine++} | ${line}`;
        }

        if (line.startsWith(' ')) {
            oldLine++;
            return `new:${newLine++} | ${line}`;
        }

        return line;
    }).join('\n');
}

async function getGitDiff(): Promise<string> {
    const execAsync = promisify(execFile);
    const { stdout } = await execAsync('git', ['diff', '--no-ext-diff', '--find-renames', `origin/${config.branchToCompare}...HEAD`, '--', '*.ts', '*.tsx', '*.mts', '*.cts']);
    return stdout;
}

/*async function buildPrompt(): Promise<RenderTextToImagesResult> {
    const profile = await readProfile();
    const diff = await getGitDiff();
    const image = await renderTextToImages(`${profile}\n\n${diff}`);
    return image;
}*/

async function buildPrompt(): Promise<string> {
    const profile = await readProfile();
    const diff = await getGitDiff();
    const prompt = `${profile}\n\n${addLineNumbersToDiff(diff)}`;
    console.log('Prompt length:', prompt.length);
    console.log('Prompt preview:\n', prompt.slice(0, 1000), '\n...\n', prompt.slice(-1000));
    //const image = await renderTextToImages(`${profile}\n\n${diff}`);
    return prompt;
}

async function getAIAnalysis(prompt: string): Promise<string> {
    /*const images: ResponseInputImage[] = prompt.pages.map((page) => ({
        type: 'input_image',
        image_url: `data:image/png;base64,${Buffer.from(page.png).toString('base64')}`,
        detail: 'auto',
    }));*/
    const openai = new OpenAI({
        apiKey: config.openAiApiKey,
    });

    const response = await openai.responses.create({
        model: config.openAIModel,
        input: [{
            role: 'user',
            content: [{
                type: 'input_text',
                text: prompt
            }] //...images]
        }],
        text: {
            format: {
                type: 'json_schema',
                schema: reviewSchema,
                name: 'typescript-review'
            }
        }
    });
    return response.output_text;
}

function getGitHubContext(): GitHubContext {
    const repository = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    const pullNumber = Number(process.env.PR_NUMBER);

    if (!repository || !token || !Number.isSafeInteger(pullNumber) || pullNumber <= 0) {
        throw new Error('GITHUB_REPOSITORY, GITHUB_TOKEN and a valid PR_NUMBER are required to publish a review.');
    }

    const [owner, repo, ...rest] = repository.split('/');
    if (!owner || !repo || rest.length > 0) {
        throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository}`);
    }

    return {
        apiUrl: process.env.GITHUB_API_URL ?? 'https://api.github.com',
        owner,
        repo,
        pullNumber,
        token,
    };
}

function truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength)}\n\n…resultado truncado…` : value;
}

function formatFinding(finding: Finding): string {
    return `### ${finding.severity.toUpperCase()}: ${finding.title}

**Archivo:** \`${finding.file}\`  
**Línea:** ${finding.line}

${finding.description}

**Recomendación:** ${finding.recommendation}`;
}

function buildReviewBody(review: ReviewSchema, inlineCommentsPublished: boolean): string {
    const marker = '<!-- typescript-review -->';
    const findings = review.findings.length === 0
        ? 'No se han encontrado problemas de TypeScript en los cambios analizados.'
        : review.findings.map(formatFinding).join('\n\n---\n\n');
    const inlineNote = inlineCommentsPublished
        ? 'Los hallazgos también se han añadido como comentarios en línea cuando GitHub ha podido asociarlos al diff.'
        : 'GitHub no ha podido asociar los hallazgos al diff; se incluyen a continuación en el resumen.';

    return truncate(`${marker}
## Revisión automática de TypeScript

${inlineNote}

${findings}`, maxReviewBodyLength);
}

function toInlineComment(finding: Finding): { body: string; line: number; path: string; side: 'RIGHT' } {
    return {
        body: truncate(`**${finding.severity.toUpperCase()}: ${finding.title}**

${finding.description}

**Recomendación:** ${finding.recommendation}`, maxReviewBodyLength),
        line: finding.line,
        path: finding.file,
        side: 'RIGHT',
    };
}

async function createReview(
    context: GitHubContext,
    review: ReviewSchema,
    includeInlineComments: boolean,
): Promise<void> {
    const comments = includeInlineComments && review.findings.length > 0
        ? review.findings.map(toInlineComment) : [];
    const url = new URL(
        `/repos/${encodeURIComponent(context.owner)}/${encodeURIComponent(context.repo)}/pulls/${context.pullNumber}/reviews`,
        context.apiUrl,
    );

    await axios.post(url.toString(), {
        body: buildReviewBody(review, includeInlineComments),
        comments,
        event: 'COMMENT',
    }, {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${context.token}`,
            'User-Agent': 'el-velo-typescript-review',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
}

async function writeReview(review: ReviewSchema): Promise<void> {
    const context = getGitHubContext();

    try {
        await createReview(context, review, true);
    } catch (error: unknown) {
        // GitHub rejects the complete request when one requested line is not in the PR diff.
        // Publish a native review anyway, preserving every finding in its summary.
        if (axios.isAxiosError(error) && error.response?.status === 422 && review.findings.length > 0) {
            await createReview(context, review, false);
            return;
        }

        throw error;
    }
}

async function main(): Promise<void> {
    const prompt = await buildPrompt();
    const response = await getAIAnalysis(prompt);
    const review: ReviewSchema = JSON.parse(response) as ReviewSchema;
    await writeReview(review);
}

main().catch((error: unknown) => {
    console.error('Error running TypeScript review:', error);
    process.exitCode = 1;
});
