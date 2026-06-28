import type { StartedSocatContainer, StartedTestContainer, WaitStrategy } from 'testcontainers';
import type { BindMode } from 'testcontainers/build/types.js';

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

export interface Volume {
    source: string,
    target: string,
    mode?: BindMode
}

export interface RunningContainer {
    constainer: StartedTestContainer,
    portsMapping: PortMapping[]
}

export interface ExposedUrl {
    url: string;
}

export interface PortMapping {
    exposedPort: number,
    soc: StartedSocatContainer
}
