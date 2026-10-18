import { BehaviorSubject } from 'rxjs';
import { EnvironmentState } from '@el_velo/common';
import type { Environment } from '@el_velo/common';
import { vi } from 'vitest';

export const environmentState = new BehaviorSubject<EnvironmentState>(EnvironmentState.STOPPED);

export const environmentMock: Environment = {
    services: [],
    entrypoint: '',
    state: environmentState.asObservable(),
    exec: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
};
