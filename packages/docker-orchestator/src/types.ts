import { WaitStrategy } from "testcontainers";

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

export interface Environment {
    services: Service[];
    entrypoint: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    exec(command: string, options?: { timeoutMs?: number }): Promise<CommandResult>;
}

export interface Code {
    id: string;
    description: string;
};

export interface Result<T> {
    code: Code;
    payload: T;
}
