import { createCipheriv, randomBytes, scryptSync } from 'node:crypto';

import type { ReviewSchema } from '../../src/config.js';

export const finding = (overrides: Partial<ReviewSchema['findings'][number]> = {}): ReviewSchema['findings'][number] => ({
    severity: 'medium', file: 'src/example.ts', line: 2, title: 'Example issue', description: 'The implementation has an issue.', recommendation: 'Correct the implementation.', ...overrides,
});

export function encryptProfile(plaintext: string, password = 'test-profile-key'): string {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = scryptSync(password, salt, 32);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
    return ['v1', salt, iv, cipher.getAuthTag(), ciphertext].map((value) => typeof value === 'string' ? value : value.toString('base64')).join(':');
}

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
