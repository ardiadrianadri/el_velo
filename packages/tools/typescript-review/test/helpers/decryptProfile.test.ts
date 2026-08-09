import { describe, expect, it } from 'vitest';

import { decryptProfile } from '../../src/helpers/decryptProfile.js';
import { encryptProfile } from './fixtures.js';

describe('decryptProfile', () => {
    it('decrypts a valid profile', () => {
        expect(decryptProfile(encryptProfile('Trusted profile'))).toBe('Trusted profile');
    });

    it('rejects a missing key, malformed input, and invalid ciphertext', () => {
        const key = process.env.TYPESCRIPT_REVIEW_PROFILE_KEY;
        delete process.env.TYPESCRIPT_REVIEW_PROFILE_KEY;
        expect(() => decryptProfile(encryptProfile('profile'))).toThrow('TYPESCRIPT_REVIEW_PROFILE_KEY');
        process.env.TYPESCRIPT_REVIEW_PROFILE_KEY = key;
        expect(() => decryptProfile('not-an-encrypted-profile')).toThrow('not a valid encrypted');
        expect(() => decryptProfile(encryptProfile('profile', 'other-key'))).toThrow('Unable to decrypt');
    });
});
