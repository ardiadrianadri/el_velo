import { describe, expect, it } from 'vitest';

import { decryptProfile } from '../../src/helpers/decryptProfile.js';
import { encryptProfile } from './fixtures.js';

describe('decryptProfile', () => {
    it('decrypts the v1 profile format used by existing base branches', () => {
        expect(decryptProfile(encryptProfile('Trusted profile'))).toBe('Trusted profile');
    });

    it('rejects malformed encrypted profiles and invalid ciphertext', () => {
        expect(() => decryptProfile('not-an-encrypted-profile')).toThrow('not a valid encrypted');
        expect(() => decryptProfile(encryptProfile('profile', 'other-key'))).toThrow('Unable to decrypt');
    });
});
