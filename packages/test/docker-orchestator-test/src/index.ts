import { DockerEnvironment } from '@el_velo/docker-orchestator';
import { type Service, EnvironmentState } from '@el_velo/common';
import { Logger } from '@el_velo/common';
import { filter, firstValueFrom } from 'rxjs';

import { ENVIRONMENT_CONFIG } from './config.js';
import axios from 'axios';

function checkHttpResult(result: string, expectedResult: string): boolean {
    return result.includes(expectedResult);
}

function checkCommandResult(result: any, expectedResult: any): boolean {
    return result.code.id === expectedResult.code.id &&
        result.code.description === expectedResult.code.description &&
        result.payload.exitCode === expectedResult.payload.exitCode &&
        result.payload.stdout === expectedResult.payload.stdout &&
        result.payload.stderr === expectedResult.payload.stderr;
}

async function startTest(): Promise<void> {
    const logger = new Logger();
    const objectName = 'Docker orquestator test';
    const methodName = 'startTest';

    const httpExpectedResult = 'If you see this page, nginx is successfully installed and working';
    const commandExpectedResult = {
        code: {
            id: '0000',
            description: 'Operation completed successfully.'
        },
        payload: {
            exitCode: 0,
            stdout: 'Hello world!\n',
            stderr: '',
            durationMs: 34
        }
    };

    logger.info(objectName, methodName, 'Starting docker container test...');
    const services: Service[] = ENVIRONMENT_CONFIG;
    const dockerEnvironment = new DockerEnvironment(services, services[1].name);
    const results = await dockerEnvironment.start();
    const waitUntilEnvironmentReady = dockerEnvironment.state.pipe(
        filter(state => state === EnvironmentState.STARTED)
    );
    await firstValueFrom(waitUntilEnvironmentReady);
    const response = await axios.get(`http://${results.payload[0].url}`);

    if (!checkHttpResult(response.data, httpExpectedResult)) {
        logger.error(objectName, methodName, new Error('HTTP response does not match expected result.'));
        throw new Error('HTTP response does not match expected result.');
    }

    const commandResult = await dockerEnvironment.exec(['echo', 'Hello world!']);
    console.log('Command result from backend service:', commandResult);

    if (!checkCommandResult(commandResult, commandExpectedResult)) {
        logger.error(objectName, methodName, new Error('Command execution result does not match expected result.'));
        throw new Error('Command execution result does not match expected result.');
    }

    await dockerEnvironment.stop();
}

startTest().then(() => {
    console.log('Test completed successfully.');
    process.exit(0);
}).catch((error) => {
    console.error('Error during test execution:', error);
    process.exit(1);
});