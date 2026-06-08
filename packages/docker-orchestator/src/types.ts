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
