import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { VeloError } from '@el_velo/common';

import { CODES, EnvironmentState } from '../src/constants.js';
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
    beforeEach(() => {
        env = new DockerEnvironment(
            [{ name: 'app', image: 'node' }],
            'app',
            mockLogger as any,
            pathValidationMock as any,
            dockerServiceValidator as any
            
        );
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
            expect(env.state).toBe(EnvironmentState.STOPPED);
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
            expect(env.state).toBe(EnvironmentState.STARTED);
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
            expect(env.state).toBe(EnvironmentState.FAILED);
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

            expect(env.state).toBe(EnvironmentState.STARTED);
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
            expect(env.state).toBe(EnvironmentState.FAILED);
        });

        it('should rollback when container start fails', async () => {
            const errorMsg = 'container error';
            mockContainerBuilder.start.mockRejectedValueOnce(new Error(errorMsg));
            await expect(env.start()).rejects.toThrow();
            expect(env.state).toBe(EnvironmentState.FAILED);
        });
    });

    describe('stop', () => {
        it('should stop environment', async () => {
            await env.start();
            const result = await env.stop();

            expect(result.code).toBe(CODES.SUCCESS);
            expect(mockContainer.stop).toHaveBeenCalledOnce();
            expect(mockNetwork.stop).toHaveBeenCalledOnce();
            expect(env.state).toBe(EnvironmentState.STOPPED);
        });

        it('should allow stop when already stopped', async () => {
            const result = await env.stop();

            expect(result.code).toBe(CODES.SUCCESS);
        });

        it('should fail when network stop fails', async () => {
            const errorMsg = 'network stop error';
            mockNetwork.stop.mockRejectedValueOnce(
                new Error(errorMsg)
            );

            await env.start();
            await expect(env.stop()).rejects.toThrow();
            expect(env.state).toBe(EnvironmentState.FAILED);
        });

        it('should fail when a container stop fails', async () => {
            const errorMsg = 'container stop error';
            mockContainer.stop.mockRejectedValueOnce(new Error(errorMsg));

            await env.start();
            await expect(env.stop()).rejects.toThrow();
            expect(env.state).toBe(EnvironmentState.FAILED);
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
