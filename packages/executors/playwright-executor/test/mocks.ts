import { BehaviorSubject } from 'rxjs';
import { BrowserName, EnvironmentState, PlaywrightConnectionType } from '@el_velo/common';
import { vi } from 'vitest';

export const chromium = {
    connectOverCDP: vi.fn(),
    connect: vi.fn()
};
export const firefox = {
    connectOverCDP: vi.fn(),
    connect: vi.fn()
};
export const webkit = {
    connectOverCDP: vi.fn(),
    connect: vi.fn()
};

export const logger = { info: vi.fn(), debug: vi.fn(), error: vi.fn() };
export const state = new BehaviorSubject(EnvironmentState.STOPPED);
export const environment = {
    services: [],
    entrypoint: '',
    state: state.asObservable(),
    exec: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
};
export const page = {
    goto: vi.fn(), content: vi.fn(), close: vi.fn(), click: vi.fn(), fill: vi.fn(), press: vi.fn(), hover: vi.fn(),
    focus: vi.fn(), check: vi.fn(), uncheck: vi.fn(), selectOption: vi.fn(), waitForEvent: vi.fn(), dragAndDrop: vi.fn(),
    locator: vi.fn(), evaluate: vi.fn(), waitForSelector: vi.fn()
};
export const browser = { newPage: vi.fn(), close: vi.fn() };

export const connection = (
    type = PlaywrightConnectionType.SERVER,
    browserName = BrowserName.CHROMIUM,
    url = 'ws://localhost'
): { type: PlaywrightConnectionType; browser: BrowserName; url: string } => ({ type, browser: browserName, url });

export function resetMocks(): void {
    vi.clearAllMocks();
    state.next(EnvironmentState.STOPPED);
    page.content.mockResolvedValue('<html></html>');
    page.close.mockResolvedValue(undefined);
    page.goto.mockResolvedValue(undefined);
    browser.newPage.mockResolvedValue(page);
    browser.close.mockResolvedValue(undefined);
    chromium.connect.mockResolvedValue(browser);
    chromium.connectOverCDP.mockResolvedValue(browser);
    firefox.connect.mockResolvedValue(browser);
    webkit.connect.mockResolvedValue(browser);
}
