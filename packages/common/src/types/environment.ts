import type { WaitStrategy } from 'testcontainers';
import type { Result } from './result.js';
import type { Observable } from 'rxjs';

export interface Service {
    name: string;
    image: string;
    environment?: Record<string, string>;
    command?: string[];
    exposePorts?: string[];
    portsMapping?: string[];
    volumes?: string[];
    waitStrategy?: WaitStrategy;
}

export interface CommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
}

export interface ExposedUrl {
    url: string;
}

export interface Environment {
    services: Service[];
    entrypoint: string;
    state: Observable<EnvironmentState>;

    start(): Promise<Result<ExposedUrl[]>>;
    stop(): Promise<Result<void>>;
    exec(command: string[], options?: { timeoutMs?: number }): Promise<Result<CommandResult>>
}

export enum  EnvironmentState {
    STOPPED = 'STOPPED',
    STARTING = 'STARTING',
    STARTED = 'STARTED',
    STOPPING = 'STOPPING',
    FAILED = 'FAILED',
}