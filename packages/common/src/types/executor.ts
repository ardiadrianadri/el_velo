import type { Environment } from './environment.js';

export interface TestError {
    message: string;
    cause?: unknown;
}

export interface TestResult {
    success: boolean;
    durationMs: number;
    error?: TestError;
}

export interface TestDefinition<T> {
    actions: T[];
}

export interface Executor<T> {
    execute (
        environment: Environment,
        test: TestDefinition<T>
    ): Promise<TestResult>;
}