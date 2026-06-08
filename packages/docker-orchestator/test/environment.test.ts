import { describe, expect, it, beforeEach, vi } from 'vitest';
import { VeloError } from '@el_velo/common';

import { DockerEnvironment } from '../src/environment.js';
import { CODES, EnvironmentState } from '../src/constants.js';
import { mockContainer, mockContainerBuilder, mockExec, mockLogger, mockNetwork, networkStartMock } from './mocks.js';

describe('DockerEnvironment test', () => {
    let env: DockerEnvironment;
    beforeEach(() => {
        env = new DockerEnvironment(
            [{ name: 'app', image: 'node' }],
            'app',
            mockLogger as any
        )
    });

    describe('constructor', () => {
        it('should create environment', () => {
            const env = new DockerEnvironment(
                [{ name: 'app', image: 'node:22' }],
                'app',
                mockLogger as any
            );

            expect(env.entrypoint).toBe('app');
            expect(env.state).toBe(EnvironmentState.STOPPED);
        });

        it('should throw if entrypoint does not exist', () => {
            expect(() => {
                new DockerEnvironment(
                    [{ name: 'db', image: 'postgres' }],
                    'app',
                    mockLogger as any
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
            expect(env.state).toBe(EnvironmentState.FAILED)
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

            expect(result.payload?.stdout).toBe('ok');

            expect(mockExec).toHaveBeenCalledWith([
                'echo',
                'hello',
            ]);
        });

        it('should fail when environment not started', async () => {
            await expect(env.exec(['ls','-l'])).rejects.throws(VeloError)
        });

        it('should fail when the command execution fails', async () => {
            const errorMsg = 'Error executing command';
            mockExec.mockRejectedValueOnce(new Error(errorMsg));

            await env.start();

            await expect(env.exec(['ls'])).rejects.toThrow(errorMsg);
        });

        it('should throw timeout error', async () => {
            vi.useFakeTimers()
            mockExec.mockImplementationOnce(() => {
                return new Promise(() => {});
            });

            await env.start();

            const promise = env.exec(['ls', '-l'], { timeoutMs: 1000 });
            await vi.advanceTimersByTime(1000);

            await expect(promise).rejects.toThrow(VeloError);
        });
    });
});