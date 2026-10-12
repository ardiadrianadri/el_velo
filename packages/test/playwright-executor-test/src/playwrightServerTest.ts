import { 
    BrowserName, 
    type PlaywrightConnection, 
    PlaywrightConnectionType, 
    type PlaywrightResult, 
    type ExposedUrl, 
    type Result, 
    type PlaywrightCommand
} from '@el_velo/common';
import { PlaywrightExecutor } from '@el_velo/playwright-executor';
import * as testConfig from './config.js';

import { DockerEnvironment } from '@el_velo/docker-orchestator';

const dockerEnvironment = new DockerEnvironment(testConfig.ENVIRONMENT_SERVER_CONFIG, testConfig.ENVIRONMENT_SERVER_CONFIG[1].name);

async function startEnvironment(): Promise<Result<ExposedUrl[]>> {
    console.log('Starting environment...');
    return await dockerEnvironment.start();
}

function createExecutors(url: string): PlaywrightExecutor[] {
    return testConfig.PLAYWRIGHT_SERVER_CONNECTIONS.map(
        (connection: Partial<PlaywrightConnection>): PlaywrightConnection => ({type: connection.type ?? PlaywrightConnectionType.SERVER , browser: connection.browser ?? BrowserName.CHROMIUM, url: url})
    ).map(
        (connection: PlaywrightConnection) => new PlaywrightExecutor(connection)
    );
}

async function stopEnvironment(): Promise<void> {
    console.log('Stopping environment...');
    await dockerEnvironment.stop();
}

async function runCommands(executor: PlaywrightExecutor, commands: PlaywrightCommand[]): Promise<Result<PlaywrightResult>> {
    const result = await executor.execute(commands, dockerEnvironment);
    return result;
}

export async function runPlaywrightServerTest(): Promise<void> {
    try {
        const result = await startEnvironment();
        if (result.code.id !== '0000') {
            throw new Error(`Failed to start environment. Code: ${result.code.id}`);
        }
        console.log('Environment started successfully.');
        console.log('Exposed URLs:', result.payload.map(url => url.url).join(', '));

        const executors = createExecutors(`ws://${result.payload[0].url}`);
        const results = await Promise.all(executors.map(executor => runCommands(executor, testConfig.PLAYWRIGHT_COMMANDS)));

        for (const result of results) {
            if (result.code.id !== '0000') {
                console.error(`Command execution failed. Code: ${result.code.id}`);
            } else {
                console.log('Command execution succeeded. DOM:', result.payload.dom);
            }
        }

    } catch (error) {
        console.error('Error starting environment:', error);
    } finally {
        await stopEnvironment();
    }
}