import type { Executor, Environment, Logger } from '@el_velo/common';
import { CODES, HttpMethod, type HttpCommand, type HttpResult } from './config.js';
import { Result, EnvironmentState, timeoutDuration, VeloError } from '@el_velo/common';
import { filter, firstValueFrom, timeout, throwError } from 'rxjs';

import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

export class HttpExecutor implements Executor<HttpCommand, HttpResult> {

    constructor(private logger: Logger) {}

    async execute(command: HttpCommand, environment: Environment): Promise<Result<HttpResult>> {
        const MethodName = 'execute';
        this.logger.info(HttpExecutor.name, MethodName, `Executing HTTP command: ${JSON.stringify(command)}`);
        
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

            const httpResult = await this.performHttpRequest(command);
            this.logger.debug(HttpExecutor.name, MethodName, `HTTP command executed successfully with result: ${JSON.stringify(httpResult)}`);
            return new Result(CODES.SUCCESS, httpResult);
        }
        catch (e: unknown) {
            let error: Error;
            if (e instanceof Error) {
                error = e;
            } else {
                error = new Error ('Error occurred during HTTP command execution');
            }

            this.logger.error(HttpExecutor.name, MethodName, error, CODES.HTTP_REQUEST_FAILED);
            return new Result(CODES.HTTP_REQUEST_FAILED, { status: 500, headers: {}, body: { error: error.message } });
        }
    }

    private async performHttpRequest(command: HttpCommand): Promise<HttpResult> {
        const MethodName = 'performHttpRequest';
        this.logger.debug(HttpExecutor.name, MethodName, `Executing HTTP request with command: ${JSON.stringify(command)}`);

        const { url, method, headers, body, host } = command;
        const classMethod = 'performHttpRequest';
        this.logger.debug(HttpExecutor.name, classMethod, `Performing HTTP request to ${url} with method ${method}`);

        try {
            const resquest: AxiosRequestConfig = {
                url,
                method,
                headers,
                baseURL: host
            };

            if ([ HttpMethod.POST, HttpMethod.PUT ].includes(method)) {
                resquest.data = body;
            }
            const response = await axios(resquest);
            return {
                status: response.status,
                headers: (response.headers as Record<string, string>),
                body: (response.data as Record<string, any>)
            };
        } catch (e: unknown) {
            let error: Error;
            if (e instanceof Error) {
                error = e;
            } else {
                error = new Error('Error occurred during HTTP request');
            }
            this.logger.error(HttpExecutor.name, classMethod, error, CODES.HTTP_REQUEST_FAILED);
            throw error;
        }
    }
}