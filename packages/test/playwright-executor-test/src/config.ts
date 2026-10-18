import {
    BrowserName,
    type PlaywrightCommand,
    PlaywrightConnectionType,
    type PlaywrightConnection,
    type Service,
    PlaywrightCommandType
} from '@el_velo/common';

export const ENVIRONMENT_SERVER_CONFIG: Service[] = [{
    image: 'nginx:alpine',
    name: 'frontend',
    volumes: ['./src/fixtures:/usr/share/nginx/html:ro'],
    exposePorts: ['80'],
    portsMapping: ['80:80']
}, {
    image: 'mcr.microsoft.com/playwright:v1.63.0-noble',
    name: 'playwright',
    command: ['/bin/sh', '-c', 'npx -y playwright@1.63.0 run-server --port 3000 --host 0.0.0.0'],
    exposePorts: ['3000'],
    portsMapping: ['3000:3000']
}];

export const PLAYWRIGHT_SERVER_CONNECTIONS: Partial<PlaywrightConnection>[] = [{
    type: PlaywrightConnectionType.SERVER,
    browser: BrowserName.CHROMIUM,
}, {
    type: PlaywrightConnectionType.SERVER,
    browser: BrowserName.FIREFOX,
}, {
    type: PlaywrightConnectionType.SERVER,
    browser: BrowserName.WEBKIT,
}];

export const PLAYWRIGHT_COMMANDS: PlaywrightCommand[] = [{
    type: PlaywrightCommandType.NAVIGATE,
    payload: {
        url: 'http://frontend'
    }
}, {
    type: PlaywrightCommandType.FILL,
    payload: {
        selector: '#username',
        value: 'el velo'
    }
}, {
    type: PlaywrightCommandType.CLICK,
    payload: {
        selector: '#submit'
    }
}];

export const TEST_VALIDATION = '<p id="result">Hola, el velo</p>';