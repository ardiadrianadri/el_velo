import type { StartedSocatContainer, StartedTestContainer } from 'testcontainers';
import type { BindMode } from 'testcontainers/build/types.js';

export interface Volume {
    source: string,
    target: string,
    mode?: BindMode
}

export interface RunningContainer {
    constainer: StartedTestContainer,
    portsMapping: PortMapping[]
}

export interface PortMapping {
    exposedPort: number,
    soc: StartedSocatContainer
}
