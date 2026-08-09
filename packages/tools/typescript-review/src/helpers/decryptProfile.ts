import { createDecipheriv, scryptSync } from 'node:crypto';

/** Decrypts a v1 encrypted review profile. */
export function decryptProfile(encryptedProfile: string): string {
    const encryptionKey = process.env.TYPESCRIPT_REVIEW_PROFILE_KEY;
    if (!encryptionKey) {
        throw new Error('TYPESCRIPT_REVIEW_PROFILE_KEY is required to decrypt the review profile.');
    }

    const [version, salt, iv, authenticationTag, ciphertext, ...unexpectedParts] = encryptedProfile.trim().split(':');
    if (version !== 'v1' || !salt || !iv || !authenticationTag || !ciphertext || unexpectedParts.length > 0) {
        throw new Error('The review profile is not a valid encrypted v1 profile.');
    }

    try {
        const key = scryptSync(encryptionKey, Buffer.from(salt, 'base64'), 32);
        const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
        decipher.setAuthTag(Buffer.from(authenticationTag, 'base64'));
        return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf-8');
    } catch {
        throw new Error('Unable to decrypt the review profile. Check TYPESCRIPT_REVIEW_PROFILE_KEY and the encrypted profile.');
    }
}
