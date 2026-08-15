import type { Environment } from '@el_velo/common';
import { vi } from 'vitest';

export const environmentMock: Environment = {
    services: [],
    entrypoint: '',
    exec: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
};