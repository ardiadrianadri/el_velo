import type { WaitStrategy } from 'testcontainers';
import type { BindMode } from 'testcontainers/build/types.js';

export interface Service {
    name: string;
    image: string;
    environment?: Record<string, string>;
    command?: string[];
    exposePorts?: number[];
    volumes?: string[];
    waitStrategy?: WaitStrategy;
}

export interface CommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
}

export interface Volume {
    source: string,
    target: string,
    mode?: BindMode
}
