import type { Executor, Environment, Result, CommandResult } from '@el_velo/common';

export class ExecutorCli implements Executor<string[], CommandResult> {
    async execute(command: string[], environment: Environment): Promise<Result<CommandResult>> {
        return await environment.exec(command);
    }
}