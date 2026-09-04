import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentState, timeoutDuration } from '@el_velo/common';
import { throwError } from 'rxjs';
import axios from 'axios';

import { CODES, HttpMethod } from '../src/config.js';
import { HttpExecutor } from '../src/httpExecutor.js';
import { environmentMock, environmentState, loggerMock } from './mocks.js';

vi.mock('axios', () => ({ default: vi.fn() }));

const axiosMock = vi.mocked(axios);

describe('HttpExecutor', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('waits for the environment and performs a GET request', async () => {
        const executor = new HttpExecutor(loggerMock as any);
        axiosMock.mockResolvedValue({
            status: 200,
            headers: { 'content-type': 'application/json' },
            data: { healthy: true }
        });

        const execution = executor.execute({
            host: 'http://localhost:3000',
            url: '/health',
            method: HttpMethod.GET,
            headers: { authorization: 'Bearer token' }
        }, environmentMock);
        expect(axiosMock).not.toHaveBeenCalled();

        environmentState.next(EnvironmentState.STARTED);

        await expect(execution).resolves.toEqual({
            code: CODES.SUCCESS,
            payload: {
                status: 200,
                headers: { 'content-type': 'application/json' },
                body: { healthy: true }
            }
        });
        expect(axiosMock).toHaveBeenCalledWith({
            baseURL: 'http://localhost:3000',
            url: '/health',
            method: HttpMethod.GET,
            headers: { authorization: 'Bearer token' }
        });
        expect(loggerMock.info).toHaveBeenCalledOnce();
        expect(loggerMock.debug).toHaveBeenCalledTimes(3);
    });

    it.each([HttpMethod.POST, HttpMethod.PUT])('sends the body for %s requests', async (method) => {
        const executor = new HttpExecutor(loggerMock as any);
        axiosMock.mockResolvedValue({ status: 201, headers: {}, data: { id: 1 } });
        environmentState.next(EnvironmentState.STARTED);

        await expect(executor.execute({
            host: 'http://localhost:3000',
            url: '/items',
            method,
            body: { name: 'velo' }
        }, environmentMock)).resolves.toMatchObject({ code: CODES.SUCCESS });

        expect(axiosMock).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'velo' } }));
    });

    it('returns a request failure result when the environment does not start in time', async () => {
        vi.useFakeTimers();
        const executor = new HttpExecutor(loggerMock as any);

        const execution = executor.execute({ host: 'http://localhost', url: '/', method: HttpMethod.GET }, environmentMock);
        await vi.advanceTimersByTimeAsync(timeoutDuration);

        await expect(execution).resolves.toEqual({
            code: CODES.HTTP_REQUEST_FAILED,
            payload: {
                status: 500,
                headers: {},
                body: { error: 'Timeout occurred while waiting for environment to start.' }
            }
        });
        expect(axiosMock).not.toHaveBeenCalled();
        expect(loggerMock.error).toHaveBeenCalledWith(
            HttpExecutor.name,
            'execute',
            expect.objectContaining({ message: 'Timeout occurred while waiting for environment to start.' }),
            CODES.HTTP_REQUEST_FAILED
        );
    });

    it('logs and converts an HTTP client Error into a failed result', async () => {
        const executor = new HttpExecutor(loggerMock as any);
        const error = new Error('connection refused');
        axiosMock.mockRejectedValue(error);
        environmentState.next(EnvironmentState.STARTED);

        await expect(executor.execute({ host: 'http://localhost', url: '/', method: HttpMethod.DELETE }, environmentMock)).resolves.toEqual({
            code: CODES.HTTP_REQUEST_FAILED,
            payload: { status: 500, headers: {}, body: { error: 'connection refused' } }
        });
        expect(loggerMock.error).toHaveBeenCalledWith(HttpExecutor.name, 'performHttpRequest', error, CODES.HTTP_REQUEST_FAILED);
        expect(loggerMock.error).toHaveBeenCalledWith(HttpExecutor.name, 'execute', error, CODES.HTTP_REQUEST_FAILED);
    });

    it('uses the fallback message when the HTTP client rejects with a non-Error value', async () => {
        const executor = new HttpExecutor(loggerMock as any);
        axiosMock.mockRejectedValue('connection refused');
        environmentState.next(EnvironmentState.STARTED);

        await expect(executor.execute({ host: 'http://localhost', url: '/', method: HttpMethod.GET }, environmentMock)).resolves.toMatchObject({
            payload: { body: { error: 'Error occurred during HTTP request' } }
        });
    });

    it('uses the fallback message when observing the environment fails with a non-Error value', async () => {
        const executor = new HttpExecutor(loggerMock as any);
        const failedEnvironment = { ...environmentMock, state: throwError(() => 'state unavailable') };

        await expect(executor.execute({ host: 'http://localhost', url: '/', method: HttpMethod.GET }, failedEnvironment)).resolves.toMatchObject({
            code: CODES.HTTP_REQUEST_FAILED,
            payload: { body: { error: 'Error occurred during HTTP command execution' } }
        });
    });
});
