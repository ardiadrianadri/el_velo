import { beforeEach, vi } from 'vitest';
import { EnvironmentState } from '@el_velo/common';

import { environmentState } from './mocks.js';

beforeEach(() => {
    vi.clearAllMocks();
    environmentState.next(EnvironmentState.STOPPED);
});
