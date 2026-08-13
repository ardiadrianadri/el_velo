import { DockerEnvironment } from '@el_velo/docker-orchestator';
import type { Service } from '@el_velo/common';
import { Logger } from '@el_velo/common';

import { ENVIRONMENT_CONFIG } from './config.js';
import axios from 'axios';

async function startTest(): Promise<void> {
    const logger = new Logger();
    const objectName = 'Docker orquestator test';
    const methodName = 'startTest';

    logger.info(objectName, methodName, 'Starting docker container test...');
    const services: Service[] = ENVIRONMENT_CONFIG;
    const dockerEnvironment = new DockerEnvironment(services, services[1].name);
    const results = await dockerEnvironment.start();

    const response = await axios.get(results.payload[0].url);

    console.log('Response from backend service:', response.data);
    const commandResult = await dockerEnvironment.exec(['ls', '-l', '/']);
    console.log('Command result from backend service:', commandResult);
    
    await dockerEnvironment.stop();
}

startTest().then(() => {
    console.log('Test completed successfully.');
}).catch((error) => {
    console.error('Error during test execution:', error);
});