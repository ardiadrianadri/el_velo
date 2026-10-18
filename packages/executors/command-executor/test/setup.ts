// Tests setup file for the command-executor package
import { vi, beforeEach } from 'vitest';
import { EnvironmentState } from '@el_velo/common';

import { environmentState } from './mocks.js';

beforeEach(() => {
    vi.clearAllMocks();
    environmentState.next(EnvironmentState.STOPPED);
});
