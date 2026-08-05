import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Validator } from '@cfworker/json-schema';
import OpenAI from 'openai';
import axios from 'axios';

import { config, reviewSchema, reviewText } from './config.js';
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
    try {
        const execAsync = promisify(execFile);
        const { stdout } = await execAsync(
            'git', ['diff', '--no-ext-diff', '--find-renames', `origin/${config.branchToCompare}...HEAD`, '--', '*.ts', '*.tsx', '*.mts', '*.cts'],
            { maxBuffer: config.maxGitDiffBytes }
        );
        return stdout;
    }
    catch (error: any) {
        if (error instanceof RangeError && error.message.includes('maxBuffer')) {
            throw new Error(`Git diff output exceeds the maximum buffer size of ${config.maxGitDiffBytes} bytes. Consider increasing MAX_GIT_DIFF_BYTES.`);
        }
        throw error;
    }
}

/*async function buildPrompt(): Promise<RenderTextToImagesResult> {
    const profile = await readProfile();
    const diff = await getGitDiff();
    const image = await renderTextToImages(`${profile}\n\n${diff}`);
    return image;
}*/

async function buildPrompt(diff: string): Promise<string> {
    const profile = await readProfile();
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
    return value.length > maxLength ? `${value.slice(0, maxLength)}\n\n${reviewText.truncated}` : value;
}

function formatFinding(finding: Finding): string {
    return `### ${finding.severity.toUpperCase()}: ${finding.title}

**${reviewText.fileLabel}:** \`${finding.file}\`<br>
**${reviewText.lineLabel}:** ${finding.line}

${finding.description}

**${reviewText.recommendationLabel}:** ${finding.recommendation}`;
}

function buildReviewBody(review: ReviewSchema, inlineCommentsPublished: boolean): string {
    const findings = review.findings.length === 0
        ? reviewText.noFindings
        : review.findings.map(formatFinding).join('\n\n---\n\n');
    const inlineNote = inlineCommentsPublished
        ? reviewText.inlineCommentsPublished
        : reviewText.inlineCommentsUnavailable;

    return truncate(`${reviewText.marker}
## ${reviewText.title}

${inlineNote}

${findings}`, maxReviewBodyLength);
}

interface InlineComment {
    body: string;
    line: number;
    path: string;
    side: 'RIGHT';
}

/**
 * Returns repository-relative paths and the right-side lines that GitHub can
 * associate with a review comment. A line is eligible when it appears in a
 * hunk on the new side of the unified diff (including context lines).
 */
function getReviewableDiffLines(diff: string): Map<string, Set<number>> {
    const reviewableLines = new Map<string, Set<number>>();
    let path: string | undefined;
    let newLine = 0;
    let remainingNewLines = 0;

    for (const line of diff.split('\n')) {
        if (line.startsWith('+++ ')) {
            const rightPath = line.slice(4);
            path = rightPath.startsWith('b/') ? rightPath.slice(2) : undefined;
            continue;
        }

        const hunkHeader = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
        if (hunkHeader) {
            newLine = Number(hunkHeader[1]);
            remainingNewLines = hunkHeader[2] ? Number(hunkHeader[2]) : 1;
            continue;
        }

        if (!path || remainingNewLines === 0 || line === '\\ No newline at end of file') {
            continue;
        }

        if (line.startsWith('+') || line.startsWith(' ')) {
            let lines = reviewableLines.get(path);
            if (!lines) {
                lines = new Set<number>();
                reviewableLines.set(path, lines);
            }
            lines.add(newLine++);
            remainingNewLines--;
        } else if (line.startsWith('-')) {
            // Deletions have no RIGHT-side line, so they cannot receive an
            // inline comment with side: RIGHT.
        }
    }

    return reviewableLines;
}

function normalizeFindingPath(path: string): string {
    return path.startsWith('b/') ? path.slice(2) : path;
}

function toInlineComment(finding: Finding, path: string): InlineComment {
    return {
        body: truncate(`**${finding.severity.toUpperCase()}: ${finding.title}**

${finding.description}

**${reviewText.recommendationLabel}:** ${finding.recommendation}`, maxReviewBodyLength),
        line: finding.line,
        path,
        side: 'RIGHT',
    };
}

function getInlineComments(review: ReviewSchema, diff: string): InlineComment[] {
    const reviewableLines = getReviewableDiffLines(diff);

    return review.findings.flatMap((finding) => {
        const path = normalizeFindingPath(finding.file);
        return reviewableLines.get(path)?.has(finding.line)
            ? [toInlineComment(finding, path)]
            : [];
    });
}

async function createReview(
    context: GitHubContext,
    review: ReviewSchema,
    comments: InlineComment[],
): Promise<void> {
    const url = new URL(
        `repos/${encodeURIComponent(context.owner)}/${encodeURIComponent(context.repo)}/pulls/${context.pullNumber}/reviews`,
        `${context.apiUrl.replace(/\/$/, '')}/`
    );

    await axios.post(url.toString(), {
        body: buildReviewBody(review, comments.length > 0),
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

async function writeReview(review: ReviewSchema, diff: string): Promise<void> {
    const context = getGitHubContext();
    const comments = getInlineComments(review, diff);

    try {
        await createReview(context, review, comments);
    } catch (error: unknown) {
        // GitHub rejects the complete request when one requested line is not in the PR diff.
        // Publish a native review anyway, preserving every finding in its summary.
        if (axios.isAxiosError(error) && error.response?.status === 422 && comments.length > 0) {
            await createReview(context, review, []);
            return;
        }

        throw error;
    }
}

async function main(): Promise<void> {
    const validator = new Validator(reviewSchema);
    const diff = await getGitDiff();
    const prompt = await buildPrompt(diff);
    const response = await getAIAnalysis(prompt);
    const review: ReviewSchema = JSON.parse(response) as ReviewSchema;
    const validationResult = validator.validate(review);
    if (!validationResult.valid) {
        console.error('Invalid review schema:', validationResult.errors);
        throw new Error('The AI response does not conform to the expected review schema.');
    }
    await writeReview(review, diff);
}

main().catch((error: unknown) => {
    console.error('Error running TypeScript review:', error);
    process.exitCode = 1;
});
