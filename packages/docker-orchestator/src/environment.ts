
import type { StartedNetwork, StartedTestContainer, ExecResult, StartedSocatContainer } from 'testcontainers';
import { Network, GenericContainer, SocatContainer } from 'testcontainers';
import type { Code, Service, Environment, ExposedUrl, CommandResult } from '@el_velo/common';
import { join } from 'node:path';
import { Logger, Result, VeloError, PathValidation } from '@el_velo/common';

import type { Volume, RunningContainer, PortMapping } from './types.js';
import { CODES, EnvironmentState } from './constants.js';
import type { BindMode } from 'testcontainers/build/types.js';
import { DockerServiceValidator } from './validator.js';

/**
 * Class to start up a docker environment
 */
export class DockerEnvironment implements Environment {
    public readonly services: Service[];
    public readonly entrypoint: string;
    

    private network: StartedNetwork | null = null;
    private containers: Record<string, StartedTestContainer> = {};
    private socatContainers: Record<string, StartedSocatContainer> = {};
    private _state: EnvironmentState = EnvironmentState.STOPPED;

    get state(): EnvironmentState {
        return this._state;
    }

    /**
     * Class constructor
     * @param services List of containers configuration that conform the environment
     * @param entrypoint Name of the main container where the command will run
     * @param logger Object to write the log messages
     * @param pathValidation Object to validate an OS path
     */
    constructor(
        services: Service[], 
        entrypoint: string, 
        private logger: Logger = new Logger(), 
        private pathValidation: PathValidation = new PathValidation(),
        private dockerServiceValidator: DockerServiceValidator = new DockerServiceValidator()
    ) {
        const MethodName = 'constructor';
        this.logger.info(DockerEnvironment.name, MethodName, 'Instantiating DockerEnvironment');

        const invalidErrors = this.dockerServiceValidator.validateSerivces(services)
            .filter(r => !r.valid);
    
        if (invalidErrors.length > 0) {
            const errorsMsg = invalidErrors.map(ie => ie.errors)
                .flat()
                .reduce((acc, current) => {
                    return `${acc} -- ${current.error}`;
                }, '');

            const error = new VeloError(CODES.INVALID_SERVICE_CONFIGURATION, `Invalid configuration: ${errorsMsg}`);
            this.logger.error(DockerEnvironment.name, MethodName, error);
            throw error;
        }

        if (!services.some(s => s.name === entrypoint)) {
            const error = new VeloError(CODES.ENTRYPOINT_NOT_FOUND, `Entrypoint service '${entrypoint}' not found in services list.`);
            this.logger.error(DockerEnvironment.name, MethodName, error);
            throw error;
        }
        this.services = services;
        this.entrypoint = entrypoint;
    }

    /**
     * Method to start the environment
     * @returns Returns a promise with the result 
     */
    async start(): Promise<Result<ExposedUrl[]>> {
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
            .catch((err: Error) => {
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
            return this.configContainer(service, this.network)
                .then(container => {
                    this.containers[service.name] = container.constainer;
                    return container.portsMapping;
                });
        });

        return Promise.all(containerPromises)
            .then((portsMapping) => {
                this.changeState(EnvironmentState.STARTED); 
                const pm = portsMapping.flat();
                const exposedUrl = pm.map(portMap => {
                    const { exposedPort, soc } = portMap;
                    const urlPort = soc.getMappedPort(exposedPort);
                    return {
                        url: `http://${soc.getHost()}:${urlPort}`
                    };
                });
                return new Result<ExposedUrl[]>(CODES.SUCCESS, exposedUrl);
            })
            .catch(async (err: Error) => {
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

    /**
     * Method to stop the environment
     * @returns returns a promise with the result
     */
    async stop(): Promise<Result<void>> {
        const methodName = 'stop';
        this.logger.info(DockerEnvironment.name, methodName, 'Stoping environment');

        if (this._state === EnvironmentState.STOPPED) {
            return new Result<void>(CODES.SUCCESS, undefined);
        }

        this.changeState(EnvironmentState.STOPPING);
        return Promise.allSettled(Object.keys(this.containers).map(async containerName => {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this.socatContainers[containerName]) {
                await this.socatContainers[containerName].stop().catch((err: Error) => {
                    this.logger.error(
                        DockerEnvironment.name,
                        methodName,
                        err,
                        CODES.SOCAT_STOP_FAILED,
                    );
                    this.changeState(EnvironmentState.FAILED);
                    throw err;
                });
            }

            return this.containers[containerName].stop().catch((err: Error) => {
                this.logger.error(
                    DockerEnvironment.name,
                    methodName,
                    err,
                    CODES.CONTAINER_STOP_FAILED,
                );
                this.changeState(EnvironmentState.FAILED);
                throw err;
            });
        })).then(async (results) => {
                const failures = results.filter(r => r.status === 'rejected');

                if (failures.length > 0) {
                    this.changeState(EnvironmentState.FAILED);
                    const error = new VeloError(CODES.SERVICE_STOP_FAILURE, (failures[0].reason as string));
                    this.logger.error(DockerEnvironment.name, methodName, error);
                    throw error;
                }

                if (this.network) {
                    await this.network.stop().catch((err: Error) => {
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
            });
    }

    /**
     * Method to execute a command in the main container of the environment
     * @param command Array of string that represent the command to execute
     * @param options [Optional] Object with configuration parameters for the command execution
     * @returns Return a promise with the result of the command execution
     */
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
                .catch((err: Error) => {
                    const code = err instanceof VeloError ? err.code : CODES.COMMAND_EXECUTION_FAILURE;
                    this.doFailedResult(methodName, err, timeoutHandle, code);
                    throw err;
                });
        }

        return execPromise.catch((err: Error) => {
                this.doFailedResult(methodName, err, timeoutHandle, CODES.COMMAND_EXECUTION_FAILURE);
                throw err;
            });
    }

    /**
     * Method to configure a volumen in the environment
     * @param volumen String that represents de volumen mapping between the host and the container (<path from the host>:<path from the container>:<mode>)
     * @returns Return a Volume object that represent the volume for the container
     */
    private async setVolumen (volumen: string): Promise<Volume> {
        const methodName = 'setVolumen';
        this.logger.debug(DockerEnvironment.name, methodName, `Setting up containers volume ${volumen}`);
        const volumenParts = volumen.split(':').map((part, index) => {
            return index === 2 ? part.trim() : join(process.cwd(), part.trim());
        });

        if (!await this.pathValidation.validate(volumenParts[0])) {
            const error = new VeloError(CODES.INVALID_VOLUME_PATH, `${volumenParts[0]} is not a valid path`);
            this.logger.error(DockerEnvironment.name, methodName, error);
            throw error;
        }

        if (!await this.pathValidation.validate(volumenParts[1], false)) {
            const error = new VeloError(CODES.INVALID_VOLUME_PATH, `${volumenParts[1]} is not a valid path`);
            this.logger.error(DockerEnvironment.name, methodName, error);
            throw error;
        }

        return {
            source: volumenParts[0],
            target: volumenParts[1],
            mode: (volumenParts[2] as BindMode)
        };
    }

    private async configPortsMapping(portMapping: string, network: StartedNetwork, exposedPort: number[], containerName: string): Promise<PortMapping> {
        const methodName = 'configPortsMapping';
        this.logger.debug(DockerEnvironment.name, methodName, 'Configuring ports mapping');
        const [localPort, containerPort] = portMapping.split(':');


        if (!exposedPort.some(p => p === Number.parseInt(containerPort))) {
            const error = new VeloError(CODES.MAPPED_PORT_IS_NOT_EXPOSED, `The any exposed port matchs with the container mapped port ${containerPort}`);
            this.logger.error(DockerEnvironment.name, methodName, error);
            throw error;
        }

        this.socatContainers[containerName] = await new SocatContainer()
            .withNetwork(network)
            .withTarget(Number.parseInt(localPort), containerName, Number.parseInt(containerPort))
            .start();

        return {
            exposedPort: Number.parseInt(localPort),
            soc: this.socatContainers[containerName]
        };
            
    }

    private async configContainer(service: Service, network: StartedNetwork | null): Promise<RunningContainer> {
        const methodName = 'configContainer';
        this.logger.debug(DockerEnvironment.name, methodName, 'Configuring docker environment');
        const ports = service.exposePorts && service.exposePorts.length > 0
            ? service.exposePorts.map(num => Number.parseInt(num))
            : [];
        const genericContainer = new GenericContainer(service.image)
            .withCommand(service.command ?? [])
            .withExposedPorts(...ports)
            .withEnvironment(service.environment ?? {});

        let socs: PortMapping[] = [];

        if (service.volumes && service.volumes.length > 0) {
            const volumes = await Promise.all(service.volumes.map(this.setVolumen.bind(this)));
            genericContainer.withBindMounts(volumes);
        }

        if (network) {
            genericContainer.withNetwork(network)
            .withNetworkAliases(service.name);
        }

        if (
            network && 
            service.portsMapping && 
            service.portsMapping.length > 0 && 
            service.exposePorts && service.exposePorts.length > 0 &&
            service.name === this.entrypoint
        ) {
            const ports = service.exposePorts.map(num => Number.parseInt(num));
            socs = await Promise.all(service.portsMapping.map(async pm => await this.configPortsMapping(pm, network, ports, this.entrypoint)));
            
        }

        return {
            constainer: await genericContainer.start(),
            portsMapping: socs
        };
    }

    private doFailedResult(methodName: string, error: Error, timeHandler?: NodeJS.Timeout, code?: Code): void {
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

    private changeState(newState: EnvironmentState): void {
        const methodName = 'changeState';
        this.logger.info(DockerEnvironment.name, methodName, `Changing environment state from ${this._state} to ${newState}`);

        this._state = newState;
    }
}