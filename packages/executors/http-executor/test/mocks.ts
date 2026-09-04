import type { Environment } from '@el_velo/common';
import { EnvironmentState } from '@el_velo/common';
import { BehaviorSubject } from 'rxjs';
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

export const loggerMock = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
};
