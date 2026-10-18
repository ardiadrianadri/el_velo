import { ExecutorCli } from '@el_velo/command-executor';
import { DockerEnvironment } from '@el_velo/docker-orchestator';
import type { Service } from '@el_velo/common';
import { Logger } from '@el_velo/common';

import { ENVIRONMENT_CONFIG } from './config.js';

function checkResult(result: any, expectedResult: any): boolean {
    return result.code.id === expectedResult.code.id &&
        result.code.description === expectedResult.code.description &&
        result.payload.exitCode === expectedResult.payload.exitCode &&
        result.payload.stdout === expectedResult.payload.stdout &&
        result.payload.stderr === expectedResult.payload.stderr;
}


async function startTest(): Promise<void> {
    const logger = new Logger();
    const objectName = 'Command executor test';
    const methodName = 'startTest';

    const expectedResult = {
        code: {
            id: '0000',
            description: 'Operation completed successfully.'
        },
        payload: {
            exitCode: 0,
            stdout: 'Hello, World!\n',
            stderr: '',
            durationMs: 34
        }
    };

    logger.info(objectName, methodName, 'Starting command executor test...');
    const services: Service[] = ENVIRONMENT_CONFIG;
    const dockerEnvironment = new DockerEnvironment(services, services[1].name);
    const executor = new ExecutorCli(logger);
    await dockerEnvironment.start();
    const result = await executor.execute(['echo', 'Hello, World!'], dockerEnvironment);

    if (!checkResult(result, expectedResult)) {
        logger.error(objectName, methodName, new Error('Command execution result does not match expected result.'));
        throw new Error('Command execution result does not match expected result.');
    }

    logger.info(objectName, methodName, `Command execution result: ${JSON.stringify(result)}`);
    await dockerEnvironment.stop();
}

startTest().then(() => {
    console.log('Test completed successfully.');
    process.exit(0);
}).catch((error) => {
    console.error('Error during test execution:', error);
    process.exit(1);
});