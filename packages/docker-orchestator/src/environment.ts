
import { Network, StartedNetwork, GenericContainer, StartedTestContainer } from "testcontainers";

import { Environment, Service, CommandResult } from './types.js';

export class DockerEnvironment implements Environment {
    services: Service[];
    entrypoint: string;

    private network: StartedNetwork | null = null;
    private containers: Record<string, StartedTestContainer> = {};

    constructor(services: Service[], entrypoint: string) {
        if (!services.some(s => s.name === entrypoint)) {
            throw new Error(`Entrypoint service '${entrypoint}' not found in services list.`);
        }
        this.services = services;
        this.entrypoint = entrypoint;
    }

    async start(): Promise<void> {
        this.network = await new Network().start();

        for (const service of this.services) {
            const container = await new GenericContainer(service.image)
            .withCommand(service.command || [])
            .withExposedPorts(...(service.exposePorts || []))
            .withEnvironment(service.environment || {})
            .withNetwork(this.network)
            .withNetworkAliases(service.name)
            .start();
            this.containers[service.name] = container;
        }
    }

    async stop(): Promise<void> {
        if (this.network) {
            await this.network.stop();
        }
    }

    async exec(command: string, options?: { timeoutMs?: number }): Promise<CommandResult> {
        return {
            exitCode: 0,
            stdout: '',
            stderr: '',
            durationMs: 0,
        };
    }
}