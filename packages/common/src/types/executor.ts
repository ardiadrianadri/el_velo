import type { Environment } from './environment.js';
import type { Result } from './result.js';

export interface Executor <TCommand, TResult> {
  execute(command: TCommand, environment: Environment): Promise<Result<TResult>>;
}