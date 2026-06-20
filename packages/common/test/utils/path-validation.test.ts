import {
    describe,
    it,
    expect,
    vi,
    beforeEach
} from 'vitest';

import { PathValidation } from '../../src/index.js';

const { checkPathMock } = vi.hoisted(() => ({
    checkPathMock: vi.fn(),
}));

vi.mock('node:util', () => ({
    promisify: vi.fn(() => checkPathMock),
}));

describe('PathValidation', () => {
    const pathValidation = new PathValidation();

    beforeEach(() => {
        checkPathMock.mockReset();
    });

    it('should return false if the path has a length 0', async () => {
        expect(await pathValidation.validate('')).toBe(false);
    });

    it('should return false if the path has the character "\0"', async () => {
        expect(await pathValidation.validate('test\0')).toBe(false);
    });

    it('should return true if the path has a length bigger than 0 and no character "\0" and the path is not local', async () => {
        expect(await pathValidation.validate('path test', false)).toBe(true);
    });

    it('should return false if the path is local and it does not exist', async () => {
        checkPathMock.mockRejectedValueOnce(new Error('Path does not exist'));

        expect(await pathValidation.validate('Test validation')).toBe(false);
    });

    it('should return true if the path is local and it exists', async () => {
        checkPathMock.mockResolvedValueOnce(undefined);

        expect(await pathValidation.validate('Test validation')).toBe(true);
    });
});
