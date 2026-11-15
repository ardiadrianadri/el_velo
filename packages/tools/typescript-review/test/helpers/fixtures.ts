import type { ReviewSchema } from '../../src/config.js';

export const finding = (overrides: Partial<ReviewSchema['findings'][number]> = {}): ReviewSchema['findings'][number] => ({
    severity: 'medium', file: 'src/example.ts', line: 2, title: 'Example issue', description: 'The implementation has an issue.', recommendation: 'Correct the implementation.', ...overrides,
});

export const diff = `diff --git a/src/example.ts b/src/example.ts
index 1111111..2222222 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -1,2 +1,3 @@
 const unchanged = true;
-const removed = true;
+const added = true;
+const second = true;
\\ No newline at end of file`;
