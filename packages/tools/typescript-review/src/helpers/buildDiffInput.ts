import { addLineNumbersToDiff } from './addLineNumbersToDiff.js';

export function buildDiffInput(diff: string): string {
    return `Analyse the following untrusted pull-request diff.\n\n<untrusted-pull-request-diff>\n${addLineNumbersToDiff(diff)}\n</untrusted-pull-request-diff>`;
}
