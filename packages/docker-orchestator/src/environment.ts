
import { Network, StartedNetwork, GenericContainer, StartedTestContainer, ExecResult } from "testcontainers";
import { Code, Logger, Result, VeloError } from "@el_velo/common";

import { Service, CommandResult } from './types.js';
import { CODES, EnvironmentState } from './constants.js';

export class DockerEnvironment {
    public readonly services: Service[];
    public readonly entrypoint: string;
    

    private network: StartedNetwork | null = null;
    private containers: Record<string, StartedTestContainer> = {};
    private _state: EnvironmentState = EnvironmentState.STOPPED;

    get state() {
        return this._state;
    }

    constructor(services: Service[], entrypoint: string, private logger: Logger = new Logger()) {
        const MethodName = 'constructor';
        this.logger.info(DockerEnvironment.name, MethodName, 'Instantiating DockerEnvironment');
        if (!services.some(s => s.name === entrypoint)) {
            const error = new VeloError(CODES.ENTRYPOINT_NOT_FOUND, `Entrypoint service '${entrypoint}' not found in services list.`);
            this.logger.error(DockerEnvironment.name, MethodName, error);
            throw error;
        }
        this.services = services;
        this.entrypoint = entrypoint;
    }

    async start(): Promise<Result<void>> {
        const methodName = 'start';
        this.logger.info(DockerEnvironment.name, methodName, 'Starting environment');

        if (this._state !== EnvironmentState.STOPPED && this._state !== EnvironmentState.FAILED) {
            const error = new VeloError(CODES.ENVIRONMENT_ALREADY_STARTED, 'The environment has already been started.');
            this.logger.error(DockerEnvironment.name, methodName, error);
            throw error;
        }

        this.changeState(EnvironmentState.STARTING);

        this.network = await new Network()
            .start()
            .catch(err => {
                this.changeState(EnvironmentState.FAILED);
                this.logger.error(
                    DockerEnvironment.name,
                    methodName,
                    err,
                    CODES.NETWORK_START_FAILED,
                );
                throw err;
            });

        const containerPromises = this.services.map(service => {
            return new GenericContainer(service.image)
                .withCommand(service.command || [])
                .withExposedPorts(...(service.exposePorts || []))
                .withEnvironment(service.environment || {})
                .withNetwork(this.network!)
                .withNetworkAliases(service.name)
                .start()
                .then(container => {
                    this.containers[service.name] = container;
                })
        });

        return Promise.all(containerPromises)
            .then(() => {
                this.changeState(EnvironmentState.STARTED); 
                return new Result<void>(CODES.SUCCESS, undefined);
            })
            .catch(async err => {
                this.logger.error(
                    DockerEnvironment.name,
                    methodName,
                    err,
                    CODES.CONTAINER_START_FAILED,
                );
                await this.stop();
                this.changeState(EnvironmentState.FAILED);
                throw err;
            });
    }

    async stop(): Promise<Result<void>> {
        const methodName = 'stop';
        this.logger.info(DockerEnvironment.name, methodName, 'Stoping environment');

        if (this._state === EnvironmentState.STOPPED) {
            return new Result<void>(CODES.SUCCESS, undefined);
        }

        this.changeState(EnvironmentState.STOPPING);
        return Promise.allSettled(Object.values(this.containers).map(container => container.stop()))
            .then(async (results) => {
                const failures = results.filter(r => r.status === 'rejected');

                if (failures.length > 0) {
                    this.changeState(EnvironmentState.FAILED);
                    const error = new VeloError(CODES.SERVICE_STOP_FAILURE, failures[0].reason);
                    this.logger.error(DockerEnvironment.name, methodName, error);
                    throw error;
                }

                if (this.network) {
                    await this.network.stop().catch(err => {
                        this.logger.error(
                            DockerEnvironment.name,
                            methodName,
                            err,
                            CODES.NETWORK_STOP_FAILED,
                        );
                        this.changeState(EnvironmentState.FAILED);
                        throw err;
                    });
                }

                this.changeState(EnvironmentState.STOPPED);
                this.network = null;
                this.containers = {};
                return new Result<void>(CODES.SUCCESS, undefined);
            })
    }

    async exec(command: string[], options?: { timeoutMs?: number }): Promise<Result<CommandResult>> {
        const methodName = 'exec';
        this.logger.info(DockerEnvironment.name, methodName, `Executing command ${command.join(' ')} in ${this.entrypoint} container`);
        const container = this.containers[this.entrypoint];

        let timeoutHandle: NodeJS.Timeout | undefined = undefined;

        if (this._state !== EnvironmentState.STARTED) {
            const error = new VeloError(CODES.ENVIRONMENT_NOT_STARTED, 'The environment has not been started.');
            this.logger.error(DockerEnvironment.name, methodName, error);
            throw error;
        }

        if (!container) {
            const error = new VeloError(CODES.ENTRYPOINT_NOT_FOUND, `Entrypoint container '${this.entrypoint}' not found.`);
            this.logger.error(DockerEnvironment.name, methodName, error);
            throw error;
        }

        const startTime = Date.now();
        const execPromise = container.exec(command)
            .then(result => this.doSuccessResult(result, startTime, timeoutHandle));

        if (options?.timeoutMs) {
            const timeoutPromise = new Promise<Result<CommandResult>>((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    const error = new VeloError(CODES.COMMAND_EXECUTION_TIMEOUT, `Command execution timed out after ${options.timeoutMs} ms.`);
                    reject(error);
                }, options.timeoutMs);
            });

            return Promise.race([execPromise, timeoutPromise])
                .catch(err => {
                    const code = err instanceof VeloError ? err.code : CODES.COMMAND_EXECUTION_FAILURE;
                    this.doFailedResult(methodName, err, timeoutHandle, code);
                    throw err;
                });
        }

        return execPromise.catch(err => {
                this.doFailedResult(methodName, err, timeoutHandle, CODES.COMMAND_EXECUTION_FAILURE);
                throw err;
            });
    }

    private doFailedResult(methodName: string, error: Error, timeHandler?: NodeJS.Timeout, code?: Code) {
        const mName = 'doFailedResult';
        this.logger.debug(DockerEnvironment.name, mName, `Treating failer in method ${methodName}`);
        if (timeHandler) {
            clearTimeout(timeHandler);
        }

        this.logger.error(
                DockerEnvironment.name,
                methodName,
                error,
                code,
            );
    }

    private doSuccessResult(result: ExecResult, startTime: number, timeHandler?: NodeJS.Timeout): Result<CommandResult> {
        const methodName = 'doSuccessResult';
        this.logger.debug(DockerEnvironment.name, methodName, 'Return result from command executed');

        const durationMs = Date.now() - startTime;

        if (timeHandler) {
            clearTimeout(timeHandler);
        }

        return new Result<CommandResult>(CODES.SUCCESS, {
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            durationMs: durationMs,
        });
    }

    private changeState(newState: EnvironmentState) {
        const methodName = 'changeState';
        this.logger.info(DockerEnvironment.name, methodName, `Changing environment state from ${this._state} to ${newState}`);

        this._state = newState;
    }
}