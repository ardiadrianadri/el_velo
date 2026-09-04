import type { Executor, Environment, CommandResult, Logger } from '@el_velo/common';
import { EnvironmentState, timeoutDuration, VeloError, Result } from '@el_velo/common';
import { filter, firstValueFrom, timeout, throwError } from 'rxjs';
import { CODES } from './config.js';

export class ExecutorCli implements Executor<string[], CommandResult> {
    constructor(private readonly logger: Logger) { }
    async execute(command: string[], environment: Environment): Promise<Result<CommandResult>> {
        const methodName = 'execute';
        this.logger.info(ExecutorCli.name, methodName, `Executing command: ${JSON.stringify(command)}`);

        try {
            const waitUntilEnvironmentStarted = environment.state.pipe(
                filter(state => state === EnvironmentState.STARTED),
                timeout({
                    first: timeoutDuration, with: () => {
                        return throwError(() => new VeloError(CODES.ENVIRONMENT_TIMEOUT, 'Timeout occurred while waiting for environment to start.'));
                    }
                })
            );
            await firstValueFrom(waitUntilEnvironmentStarted);

            return await environment.exec(command);
        }
        catch (e: unknown) {
            let error: Error;
            if (e instanceof Error) {
                error = e;
            } else {
                error = new Error('Error occurred during command execution');
            }

            this.logger.error(ExecutorCli.name, methodName, error, CODES.ENVIRONMENT_TIMEOUT);
            return new Result(CODES.ENVIRONMENT_TIMEOUT, { exitCode: 1, stdout: '', stderr: error.message, durationMs: 0 });
        }
    }
}