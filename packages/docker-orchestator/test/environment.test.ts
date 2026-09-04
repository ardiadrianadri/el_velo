import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { EnvironmentState, VeloError } from '@el_velo/common';

import { CODES } from '../src/constants.js';
import {
    mockContainer,
    mockContainerBuilder,
    mockExec,
    mockLogger,
    mockNetwork,
    mockSocatContainer,
    mockSocatContainerBuilder,
    networkStartMock,
    pathValidationMock,
    dockerServiceValidator,
    mockPathJoin
} from './mocks.js';

vi.mock('node:path', async () => {
    const actual = await vi.importActual('node:path');
    return {
        ...actual,
        join: mockPathJoin
    };
});

import { DockerEnvironment } from '../src/environment.js';

describe('DockerEnvironment test', () => {
    let env: DockerEnvironment;
    let stateChanges: EnvironmentState[];
    beforeEach(() => {
        env = new DockerEnvironment(
            [{ name: 'app', image: 'node' }],
            'app',
            mockLogger as any,
            pathValidationMock as any,
            dockerServiceValidator as any
            
        );
        stateChanges = [];
        env.state.subscribe(state => stateChanges.push(state));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('should create environment', () => {
            const env = new DockerEnvironment(
                [{ name: 'app', image: 'node:22' }],
                'app',
                mockLogger as any,
                pathValidationMock as any,
                dockerServiceValidator as any
            );

            expect(env.entrypoint).toBe('app');
            const states: EnvironmentState[] = [];
            env.state.subscribe(state => states.push(state));
            expect(states).toEqual([EnvironmentState.STOPPED]);
        });

        it('should throw if entrypoint does not exist', () => {
            expect(() => {
                new DockerEnvironment(
                    [{ name: 'db', image: 'postgres' }],
                    'app',
                    mockLogger as any,
                    pathValidationMock as any,
                    dockerServiceValidator as any
                );
            }).toThrow(VeloError);
        });

        it('should throw if the service configuration is not valid', () => {
            dockerServiceValidator.validateSerivces.mockReturnValueOnce([
                {
                    valid: false,
                    errors: [{
                        error: 'Test error'
                    }]
                }
            ]);
            expect(() => {
                new DockerEnvironment(
                    [{ name: 'app', image: 'node:22' }],
                    'app',
                    mockLogger as any,
                    pathValidationMock as any,
                    dockerServiceValidator as any
                );
            }).toThrow(VeloError);
        });
    });

    describe('start', () => {

        it('should start environment', async () => {
            const result = await env.start();

            expect(result.code).toBe(CODES.SUCCESS);
            expect(stateChanges).toEqual([EnvironmentState.STOPPED, EnvironmentState.STARTING, EnvironmentState.STARTED]);
            expect(networkStartMock).toHaveBeenCalledOnce();
            expect(mockContainerBuilder.start).toHaveBeenCalledOnce();
        });

        it('should fail when already started', async () => {
            await env.start();
            await expect(env.start()).rejects.toThrow(VeloError);
        });

        it('should fail when netowrk start fails', async () => {
            const errorMsg = 'network error';
            networkStartMock.mockRejectedValueOnce(new Error(errorMsg));

            await expect(env.start()).rejects.toThrow(errorMsg);
            expect(stateChanges).toEqual([EnvironmentState.STOPPED, EnvironmentState.STARTING, EnvironmentState.FAILED]);
        });

        it('should configure services without a network when none is available', async () => {
            networkStartMock.mockResolvedValueOnce(null);

            await expect(env.start()).resolves.toMatchObject({ code: CODES.SUCCESS });

            expect(mockContainerBuilder.withNetwork).not.toHaveBeenCalled();
        });

        it('should stop cleanly after a network startup failure', async () => {
            networkStartMock.mockRejectedValueOnce(new Error('network error'));

            await expect(env.start()).rejects.toThrow('network error');
            await expect(env.stop()).resolves.toMatchObject({ code: CODES.SUCCESS });

            expect(stateChanges.at(-1)).toBe(EnvironmentState.STOPPED);
        });

        it('should fail when the local path does not exist', async () => {
            pathValidationMock.validate.mockResolvedValueOnce(false);
            const env = new DockerEnvironment(
                [{ name: 'app', image: 'node', volumes: ['/local/path/test:/container/path/test'] }],
                'app',
                mockLogger as any,
                pathValidationMock as any,
                dockerServiceValidator as any
            );

            await expect(env.start()).rejects.toThrow(VeloError);
        });

        it('should fail when the containr path is invalid', async () => {
            pathValidationMock.validate.mockImplementation((path, local = true) => {
                return Promise.resolve(local);
            });

            const env = new DockerEnvironment(
                [{ name: 'app', image: 'node', volumes: ['/local/path/test:/container/path/test'] }],
                'app',
                mockLogger as any,
                pathValidationMock as any,
                dockerServiceValidator as any
            );

            await expect(env.start()).rejects.toThrow(VeloError);
        });

        it('should setup a volume in the container', async () => {
            const expectedVolume = {
                source: '/local/path/test',
                target: '/container/path/test',
                mode: 'rw'
            };

            pathValidationMock.validate.mockResolvedValue(true);

            const env = new DockerEnvironment(
                [{ name: 'app', image: 'node', volumes: [`${expectedVolume.source}:${expectedVolume.target}:${expectedVolume.mode}`] }],
                'app',
                mockLogger as any,
                pathValidationMock as any,
                dockerServiceValidator as any
            );

            await env.start();

            expect(await getCurrentState(env)).toBe(EnvironmentState.STARTED);
            expect(mockContainerBuilder.withBindMounts).toHaveBeenLastCalledWith([expectedVolume]);
        });

        it('should expose a URL for a mapped port', async () => {
            const env = new DockerEnvironment(
                [{
                    name: 'app',
                    image: 'node',
                    exposePorts: ['3000'],
                    portsMapping: ['8080:3000']
                }],
                'app',
                mockLogger as any,
                pathValidationMock as any,
                dockerServiceValidator as any
            );

            const result = await env.start();

            expect(mockContainerBuilder.withExposedPorts).toHaveBeenCalledWith(3000);
            expect(mockSocatContainerBuilder.withNetwork).toHaveBeenCalledWith(mockNetwork);
            expect(mockSocatContainerBuilder.withTarget).toHaveBeenCalledWith(8080, 'app', 3000);
            expect(mockSocatContainer.getMappedPort).toHaveBeenCalledWith(8080);
            expect(result.payload).toEqual([{ url: 'http://localhost:8080' }]);
        });

        it('should fail when a mapped port is not exposed', async () => {
            const env = new DockerEnvironment(
                [{
                    name: 'app',
                    image: 'node',
                    exposePorts: ['3000'],
                    portsMapping: ['8080:4000']
                }],
                'app',
                mockLogger as any,
                pathValidationMock as any,
                dockerServiceValidator as any
            );

            await expect(env.start()).rejects.toMatchObject({
                code: CODES.MAPPED_PORT_IS_NOT_EXPOSED
            });
            expect(mockSocatContainerBuilder.start).not.toHaveBeenCalled();
            expect(await getCurrentState(env)).toBe(EnvironmentState.FAILED);
        });

        it('should rollback when container start fails', async () => {
            const errorMsg = 'container error';
            mockContainerBuilder.start.mockRejectedValueOnce(new Error(errorMsg));
            await expect(env.start()).rejects.toThrow();
            expect(stateChanges.at(-1)).toBe(EnvironmentState.FAILED);
        });
    });

    describe('stop', () => {
        it('should stop environment', async () => {
            await env.start();
            const result = await env.stop();

            expect(result.code).toBe(CODES.SUCCESS);
            expect(mockContainer.stop).toHaveBeenCalledOnce();
            expect(mockNetwork.stop).toHaveBeenCalledOnce();
            expect(stateChanges).toEqual([
                EnvironmentState.STOPPED,
                EnvironmentState.STARTING,
                EnvironmentState.STARTED,
                EnvironmentState.STOPPING,
                EnvironmentState.STOPPED
            ]);
        });

        it('should allow stop when already stopped', async () => {
            const result = await env.stop();

            expect(result.code).toBe(CODES.SUCCESS);
        });

        it('should stop the socat container associated with a mapped port', async () => {
            const environment = new DockerEnvironment(
                [{
                    name: 'app',
                    image: 'node',
                    exposePorts: ['3000'],
                    portsMapping: ['8080:3000']
                }],
                'app',
                mockLogger as any,
                pathValidationMock as any,
                dockerServiceValidator as any
            );

            await environment.start();
            await environment.stop();

            expect(mockSocatContainer.stop).toHaveBeenCalledOnce();
        });

        it('should fail when a socat container cannot be stopped', async () => {
            const environment = new DockerEnvironment(
                [{
                    name: 'app',
                    image: 'node',
                    exposePorts: ['3000'],
                    portsMapping: ['8080:3000']
                }],
                'app',
                mockLogger as any,
                pathValidationMock as any,
                dockerServiceValidator as any
            );
            mockSocatContainer.stop.mockRejectedValueOnce(new Error('socat stop error'));

            await environment.start();

            await expect(environment.stop()).rejects.toMatchObject({ code: CODES.SERVICE_STOP_FAILURE });
            expect(mockLogger.error).toHaveBeenCalledWith(
                DockerEnvironment.name,
                'stop',
                expect.any(Error),
                CODES.SOCAT_STOP_FAILED
            );
        });

        it('should fail when network stop fails', async () => {
            const errorMsg = 'network stop error';
            mockNetwork.stop.mockRejectedValueOnce(
                new Error(errorMsg)
            );

            await env.start();
            await expect(env.stop()).rejects.toThrow();
            expect(stateChanges.at(-1)).toBe(EnvironmentState.FAILED);
        });

        it('should fail when a container stop fails', async () => {
            const errorMsg = 'container stop error';
            mockContainer.stop.mockRejectedValueOnce(new Error(errorMsg));

            await env.start();
            await expect(env.stop()).rejects.toThrow();
            expect(stateChanges.at(-1)).toBe(EnvironmentState.FAILED);
        });
    });

    describe('exec', () => {
        it('should execute command', async () => {
            await env.start();

            const result = await env.exec([
                'echo',
                'hello',
            ]);

            expect(result.code).toBe(CODES.SUCCESS);

            expect(result.payload.stdout).toBe('ok');

            expect(mockExec).toHaveBeenCalledWith([
                'echo',
                'hello',
            ]);
        });

        it('should fail when environment not started', async () => {
            await expect(env.exec(['ls', '-l'])).rejects.throws(VeloError);
        });

        it('should fail when the command execution fails', async () => {
            const errorMsg = 'Error executing command';
            mockExec.mockRejectedValueOnce(new Error(errorMsg));

            await env.start();

            await expect(env.exec(['ls'])).rejects.toThrow(errorMsg);
        });

        it('should preserve the execution failure code when a timed command fails before timing out', async () => {
            mockExec.mockRejectedValueOnce(new Error('Error executing command'));
            await env.start();

            await expect(env.exec(['ls'], { timeoutMs: 1000 })).rejects.toThrow('Error executing command');
            expect(mockLogger.error).toHaveBeenCalledWith(
                DockerEnvironment.name,
                'exec',
                expect.any(Error),
                CODES.COMMAND_EXECUTION_FAILURE
            );
        });

        it('should throw timeout error', async () => {
            vi.useFakeTimers();
            mockExec.mockImplementationOnce(() => {
                return new Promise(() => { /* empty */ });
            });

            await env.start();

            const promise = env.exec(['ls', '-l'], { timeoutMs: 1000 });
            vi.advanceTimersByTime(1000);

            await expect(promise).rejects.toThrow(VeloError);
        });

        it('should clear the timeout when the command finishes in time', async () => {
            vi.useFakeTimers();
            await env.start();

            const result = await env.exec(['echo', 'hello'], { timeoutMs: 1000 });

            expect(result.code).toBe(CODES.SUCCESS);
            expect(vi.getTimerCount()).toBe(0);
        });
    });
});

async function getCurrentState(environment: DockerEnvironment): Promise<EnvironmentState> {
    return await new Promise(resolve => { environment.state.subscribe(resolve).unsubscribe(); });
}
