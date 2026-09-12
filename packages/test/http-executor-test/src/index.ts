import { DockerEnvironment } from '@el_velo/docker-orchestator';
import { HttpExecutor } from '@el_velo/http-executor';
import type { HttpResult } from '@el_velo/http-executor';
import type { Result, ExposedUrl } from '@el_velo/common';
import { EnvironmentState } from '@el_velo/common';
import { isDeepStrictEqual } from 'node:util';
import { filter, firstValueFrom } from 'rxjs';
import { ENVIRONMENT_CONFIG, EXPECTED_RESPONSES } from './config.js';

const dockerEnvironment = new DockerEnvironment(ENVIRONMENT_CONFIG, ENVIRONMENT_CONFIG[0].name);
const httpExecutor = new HttpExecutor();

async function startEnvironment(): Promise<Result<ExposedUrl[]>> {
    console.log('Starting environment...');
    return await dockerEnvironment.start();
}

async function runTest(host: string): Promise<void> {
    const waitUntilEnvironmentStarted = dockerEnvironment.state.pipe(
        filter(state => state ===  EnvironmentState.STARTED)
    );
    await firstValueFrom(waitUntilEnvironmentStarted);

    const httpCommands = EXPECTED_RESPONSES.map(testCase => ({...testCase.test, host }));
    await Promise.all(httpCommands.map(httpCommand => 
        httpExecutor.execute(httpCommand, dockerEnvironment)
            .then(result => { validateResult(result, EXPECTED_RESPONSES.find(testCase => testCase.test.url === httpCommand.url)?.response ?? {}); })
    ));
}

async function stopEnvironment(): Promise<void> {
    console.log('Stopping environment...');
    await dockerEnvironment.stop();
}

function validateResult(result: Result<HttpResult>, expectedResponse: Record<string, any>): void {
    if (result.code.id !== '0000') {
        throw new Error(`HTTP request failed with code: ${result.code.id}`);
    }

    const actualResponse = result.payload;
    if (actualResponse.status !== expectedResponse.status) {
        throw new Error(`Expected status ${expectedResponse.status}, but got ${actualResponse.status}`);
    }

    const responseHeaders = { ...actualResponse.headers };
    delete responseHeaders.date;
    delete responseHeaders['content-length'];


    const headersMatch = isDeepStrictEqual(responseHeaders, expectedResponse.headers);
    if (!headersMatch) {
        throw new Error(`Expected headers ${JSON.stringify(expectedResponse.headers)}, but got ${JSON.stringify(responseHeaders)}`);
    }

    const responseBody = structuredClone(actualResponse.body);
    delete responseBody.headers?.Host;
    delete responseBody.origin;
    delete responseBody.url;

    const bodyMatch = isDeepStrictEqual(responseBody, expectedResponse.body);
    if (!bodyMatch) {
        throw new Error(`Expected body ${JSON.stringify(expectedResponse.body)}, but got ${JSON.stringify(actualResponse.body)}`);
    }
}

async function main(): Promise<void> {
    try {
        const startResult = await startEnvironment();
        if (startResult.code.id !== '0000') {
            console.error('Failed to start environment:', startResult);
            return;
        }

        const exposedUrls = startResult.payload;
        const host = exposedUrls[0].url; // Assuming the first exposed URL is the one we want to test
        await runTest(host);
    } catch (error) {
        console.error('Error during test execution:', error);
    } finally {
        await stopEnvironment();
    }
}

main().catch(error => { console.error('Unhandled error in main:', error); });