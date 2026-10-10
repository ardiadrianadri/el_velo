import type { PlaywrightCommand, Executor, PlaywrightResult, Environment, PlaywrightConnection, Result } from '@el_velo/common';
import { Logger, PlaywrightConnectionType, BrowserName, VeloError, timeoutDuration, EnvironmentState, PlaywrightCommandType } from '@el_velo/common';
import { chromium, firefox, webkit } from 'playwright';
import type { BrowserType, Browser } from 'playwright';
import { filter, firstValueFrom, timeout } from 'rxjs';

import { CODES, playwrigthDoAction } from './config.js';

export class PlaywrightExecutor implements Executor<PlaywrightCommand[], PlaywrightResult> {

    private browserInstances: Record<BrowserName, BrowserType> = {
        [BrowserName.CHROMIUM]: chromium,
        [BrowserName.FIREFOX]: firefox,
        [BrowserName.WEBKIT]: webkit,
    };

    private browserInstance: Browser | null = null;

    constructor(private playwrightConnection: PlaywrightConnection, private logger = new Logger()) {
        const methodName = 'constructor';
        this.logger.info(PlaywrightExecutor.name, methodName, 'Initializing PlaywrightExecutor...');
        this.validateConfiguration(playwrightConnection);
    }

    private validateConfiguration(playwrightConnection: PlaywrightConnection): boolean {
        const methodName = 'validateConfiguration';
        this.logger.debug(PlaywrightExecutor.name, methodName, 'Validating configuration...');

        if (playwrightConnection.type === PlaywrightConnectionType.CDP && playwrightConnection.browser !== BrowserName.CHROMIUM) {
            const newError = new VeloError(CODES.INVALID_CONFIGURATION, `CDP connection type is only supported for Chromium browser. Provided browser: ${playwrightConnection.browser}`);
            this.logger.error(PlaywrightExecutor.name, methodName, newError);
            throw newError;
        }

        try {
            new URL(playwrightConnection.url);
        }
        catch (e: unknown) {
            const message = e instanceof Error ? e.message : `Invalid URL provided: ${playwrightConnection.url}`;
            const newError = new VeloError(CODES.INVALID_CONFIGURATION, message);
            this.logger.error(PlaywrightExecutor.name, methodName, newError);
            throw newError;
        }

        return true;
    }


    private connectByCDP(chromium: BrowserType, url: string): Promise<Browser> {
        const methodName = 'connectByCDP';
        this.logger.debug(PlaywrightExecutor.name, methodName, `Connecting to Chromium browser via CDP at URL: ${url}`);
        return chromium.connectOverCDP(url);
    }

    private async connectByServer(browserType: BrowserType, url: string): Promise<Browser> {
        const methodName = 'connectByServer';
        this.logger.debug(PlaywrightExecutor.name, methodName, `Connecting to browser via server at URL: ${url}`);
        return browserType.connect(url);
    }

    async execute(commands: PlaywrightCommand[], environment: Environment): Promise<Result<PlaywrightResult>> {
        const methodName = 'execute';
        this.logger.info(PlaywrightExecutor.name, methodName, 'Executing Playwright commands...');

        //connect with the browser based on the connection type
        const waitUntilEnvironmentStarted = environment.state.pipe(
            filter(state => state === EnvironmentState.STARTED),
            timeout({
                first: timeoutDuration, with: () => {
                    const newError = new VeloError(CODES.ENVIRONMENT_TIMEOUT, 'Timeout occurred while waiting for environment to start.');
                    this.logger.error(PlaywrightExecutor.name, methodName, newError);
                    throw newError;
                }
            })
        );

        await firstValueFrom(waitUntilEnvironmentStarted);

        const browserType = this.browserInstances[this.playwrightConnection.browser];

        if (this.playwrightConnection.type === PlaywrightConnectionType.CDP) {
            this.browserInstance = await this.connectByCDP(browserType, this.playwrightConnection.url);
        } else {
            this.browserInstance = await this.connectByServer(browserType, this.playwrightConnection.url);
        }

        let page = await this.browserInstance.newPage();

        try {
            for (const command of commands) {
                if (command.type === PlaywrightCommandType.NAVIGATE) {
                    page = await playwrigthDoAction[command.type](command.payload, this.browserInstance);
                } else {
                    page = await playwrigthDoAction[command.type](command.payload, page);
                }
            }

            const domContent = await page.content();
            await page.close();
            await this.browserInstance.close();

            return { code: CODES.SUCCESS, payload: { dom: domContent } };
        } catch (e: unknown) {
            if (e instanceof VeloError) {
                this.logger.error(PlaywrightExecutor.name, methodName, e);
                throw e;
            }

            const message = e instanceof Error ? e.message : 'Error occurred while executing commands.';
            const newError = new VeloError(CODES.ERROR_EXECUTING_COMMAND, message);
            this.logger.error(PlaywrightExecutor.name, methodName, newError);
            throw newError;
        }
    }

}