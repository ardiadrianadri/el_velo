/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, afterEach, vi } from 'vitest';
import { EnvironmentState, timeoutDuration } from '@el_velo/common';

import { CODES } from '../src/config.js';
import { ExecutorCli } from '../src/executorCli.js';
import { environmentMock, environmentState } from './mocks.js';

const loggerMock = {
    info: vi.fn(),
    error: vi.fn()
};

describe('ExecutorCli', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('waits for the environment to start before executing the command', async () => {
        const executor = new ExecutorCli(loggerMock as any);
        const command = ['echo', 'Hello, World!'];
        const expectedResult = {
            code: CODES.SUCCESS,
            payload: { stdout: 'Hello, World!\n', stderr: '', exitCode: 0, durationMs: 10 }
        };
        environmentMock.exec = vi.fn().mockResolvedValue(expectedResult);

        const execution = executor.execute(command, environmentMock);
        expect(environmentMock.exec).not.toHaveBeenCalled();

        environmentState.next(EnvironmentState.STARTING);
        environmentState.next(EnvironmentState.STARTED);

        await expect(execution).resolves.toEqual(expectedResult);
        expect(environmentMock.exec).toHaveBeenCalledWith(command);
        expect(loggerMock.info).toHaveBeenCalledOnce();
    });

    it('returns a timeout result when the environment does not start in time', async () => {
        vi.useFakeTimers();
        const executor = new ExecutorCli(loggerMock as any);

        const execution = executor.execute(['echo', 'hello'], environmentMock);
        await vi.advanceTimersByTimeAsync(timeoutDuration);

        await expect(execution).resolves.toMatchObject({
            code: CODES.ENVIRONMENT_TIMEOUT,
            payload: {
                exitCode: 1,
                stdout: '',
                durationMs: 0,
                stderr: 'Timeout occurred while waiting for environment to start.'
            }
        });
        expect(loggerMock.error).toHaveBeenCalledWith(
            ExecutorCli.name,
            'execute',
            expect.objectContaining({ message: 'Timeout occurred while waiting for environment to start.' }),
            CODES.ENVIRONMENT_TIMEOUT
        );
        expect(environmentMock.exec).not.toHaveBeenCalled();
    });

    it('converts an execution error into a failed result', async () => {
        const executor = new ExecutorCli(loggerMock as any);
        const error = new Error('command failed');
        environmentMock.exec = vi.fn().mockRejectedValue(error);
        environmentState.next(EnvironmentState.STARTED);

        await expect(executor.execute(['false'], environmentMock)).resolves.toEqual({
            code: CODES.ENVIRONMENT_TIMEOUT,
            payload: { exitCode: 1, stdout: '', stderr: 'command failed', durationMs: 0 }
        });
        expect(loggerMock.error).toHaveBeenCalledWith(ExecutorCli.name, 'execute', error, CODES.ENVIRONMENT_TIMEOUT);
    });

    it('uses a default message for errors that are not Error instances', async () => {
        const executor = new ExecutorCli(loggerMock as any);
        environmentMock.exec = vi.fn().mockRejectedValue('failure');
        environmentState.next(EnvironmentState.STARTED);

        await expect(executor.execute(['false'], environmentMock)).resolves.toMatchObject({
            code: CODES.ENVIRONMENT_TIMEOUT,
            payload: { stderr: 'Error occurred during command execution' }
        });
    });
});
