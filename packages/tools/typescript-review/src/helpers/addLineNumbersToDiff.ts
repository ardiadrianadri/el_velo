/** Adds source line numbers to the code lines in a unified diff. */
export function addLineNumbersToDiff(diff: string): string {
    let oldLine = 0;
    let newLine = 0;
    let isInsideHunk = false;

    return diff.split('\n').map((line) => {
        if (line.startsWith('diff --git ')) {
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
        if (isInsideHunk) {
            if (line === '\\ No newline at end of file') {
                return line;
            }
            if (line.startsWith('+')) {
                return `added:${newLine++} | ${line}`;
            }
            if (line.startsWith('-')) {
                return `old:${oldLine++} | ${line}`;
            }
            if (line.startsWith(' ')) {
                oldLine++;
                return `context:${newLine++} | ${line}`;
            }
        }
        return line;
    }).join('\n');
}
