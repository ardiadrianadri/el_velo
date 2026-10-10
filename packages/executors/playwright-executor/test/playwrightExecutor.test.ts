/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throwError } from 'rxjs';
import {
    BrowserName,
    EnvironmentState,
    PlaywrightCommandType,
    PlaywrightConnectionType,
    timeoutDuration,
    VeloError
} from '@el_velo/common';
import type { Browser, Page } from 'playwright';
import { browser, chromium, connection, environment, firefox, logger, page, resetMocks, state, webkit } from './mocks.js';
vi.mock('playwright', async () => {
    const mocks = await import('./mocks.js');
    return { chromium: mocks.chromium, firefox: mocks.firefox, webkit: mocks.webkit };
});
import { CODES } from '../src/config.js';
import { PlaywrightExecutor } from '../src/playrightExecutor.js';

describe('PlaywrightExecutor', () => {
    beforeEach(resetMocks);
    afterEach(() => vi.useRealTimers());

    it('validates connection type and URL at construction', () => {
        expect(() => new PlaywrightExecutor(connection(PlaywrightConnectionType.CDP, BrowserName.FIREFOX) as any, logger as any)).toThrow(VeloError);
        expect(() => new PlaywrightExecutor(connection(PlaywrightConnectionType.SERVER, BrowserName.CHROMIUM, 'not a URL') as any, logger as any)).toThrow(VeloError);
        expect(logger.error).toHaveBeenCalledTimes(2);
    });

    it('uses the fallback URL message when URL construction throws a non-Error', () => {
        // The production branch handles any thrown value from URL construction.
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class, @typescript-eslint/only-throw-error
        vi.stubGlobal('URL', class { constructor() { throw 'invalid URL'; } });
        expect(() => new PlaywrightExecutor(connection() as any, logger as any)).toThrow(/Invalid URL provided: ws:\/\/localhost/);
        vi.unstubAllGlobals();
    });

    it.each([
        [BrowserName.CHROMIUM, chromium], [BrowserName.FIREFOX, firefox], [BrowserName.WEBKIT, webkit]
    ])('connects to %s through the server and executes an empty command list', async (name, type) => {
        const executor = new PlaywrightExecutor(connection(PlaywrightConnectionType.SERVER, name as BrowserName) as any, logger as any);
        const result = executor.execute([], environment as any);
        expect(type.connect).not.toHaveBeenCalled();
        state.next(EnvironmentState.STARTED);
        await expect(result).resolves.toEqual({ code: CODES.SUCCESS, payload: { dom: '<html></html>' } });
        expect(type.connect).toHaveBeenCalledWith('ws://localhost');
        expect(page.close).toHaveBeenCalledOnce();
        expect(browser.close).toHaveBeenCalledOnce();
    });

    it('connects through CDP and creates a new page for navigation', async () => {
        const executor = new PlaywrightExecutor(connection(PlaywrightConnectionType.CDP) as any, logger as any);
        const result = executor.execute([{ type: PlaywrightCommandType.NAVIGATE, payload: { url: 'https://example.com' } }] as any, environment as any);
        state.next(EnvironmentState.STARTED);
        await expect(result).resolves.toMatchObject({ code: CODES.SUCCESS });
        expect(chromium.connectOverCDP).toHaveBeenCalledWith('ws://localhost');
        expect(browser.newPage).toHaveBeenCalledTimes(2);
        expect(page.goto).toHaveBeenCalledWith('https://example.com');
    });

    it('waits for STARTED and throws a VeloError on environment timeout', async () => {
        vi.useFakeTimers();
        const executor = new PlaywrightExecutor(connection() as any, logger as any);
        const result = executor.execute([], environment as any);
        const assertion = expect(result).rejects.toMatchObject({ code: CODES.ENVIRONMENT_TIMEOUT });
        await vi.advanceTimersByTimeAsync(timeoutDuration);
        await assertion;
        expect(chromium.connect).not.toHaveBeenCalled();
    });

    it('rethrows VeloErrors from actions and wraps ordinary and non-Error failures', async () => {
        const invalid = new PlaywrightExecutor(connection() as any, logger as any);
        const bad = invalid.execute([{ type: PlaywrightCommandType.CLICK, payload: {} }] as any, environment as any);
        state.next(EnvironmentState.STARTED);
        await expect(bad).rejects.toBeInstanceOf(VeloError);
        expect(page.close).not.toHaveBeenCalled();

        resetMocks();
        const executor = new PlaywrightExecutor(connection() as any, logger as any);
        page.content.mockRejectedValueOnce(new Error('page failed'));
        const failure = executor.execute([], environment as any);
        state.next(EnvironmentState.STARTED);
        await expect(failure).rejects.toMatchObject({ code: CODES.ERROR_EXECUTING_COMMAND, message: 'page failed' });

        resetMocks();
        const nonErrorExecutor = new PlaywrightExecutor(connection() as any, logger as any);
        page.content.mockRejectedValueOnce('failure');
        const nonError = nonErrorExecutor.execute([], environment as any);
        state.next(EnvironmentState.STARTED);
        await expect(nonError).rejects.toMatchObject({ code: CODES.ERROR_EXECUTING_COMMAND, message: 'Error occurred while executing commands.' });
    });

    it('wraps an environment stream error that is not an Error', async () => {
        const executor = new PlaywrightExecutor(connection() as any, logger as any);
        await expect(executor.execute([], { ...environment, state: throwError(() => 'failure') } as any))
            .rejects.toBe('failure');
    });
});

describe('playwrigthDoAction', () => {
    beforeEach(resetMocks);

    it.each([
        [PlaywrightCommandType.CLICK, { selector: '#button' }, 'click', ['#button']],
        [PlaywrightCommandType.FILL, { selector: '#name', value: 'Velo' }, 'fill', ['#name', 'Velo']],
        [PlaywrightCommandType.PRESS, { selector: '#name', key: 'Enter' }, 'press', ['#name', 'Enter']],
        [PlaywrightCommandType.HOVER, { selector: '#menu' }, 'hover', ['#menu']],
        [PlaywrightCommandType.FOCUS, { selector: '#name' }, 'focus', ['#name']],
        [PlaywrightCommandType.CHECK, { selector: '#terms' }, 'check', ['#terms']],
        [PlaywrightCommandType.UNCHECK, { selector: '#terms' }, 'uncheck', ['#terms']],
        [PlaywrightCommandType.SELECT, { selector: '#country', values: ['ES'] }, 'selectOption', ['#country', ['ES']]],
        [PlaywrightCommandType.DRAG_AND_DROP, { sourceSelector: '#from', targetSelector: '#to' }, 'dragAndDrop', ['#from', '#to']],
        [PlaywrightCommandType.WAIT, { selector: '#ready' }, 'waitForSelector', ['#ready']]
    ])('executes %s', async (command, payload, method, args) => {
        const { playwrigthDoAction } = await import('../src/config.js');
        const result = await playwrigthDoAction[command as PlaywrightCommandType](payload as any, page as unknown as Browser & Page);
        expect(result).toBe(page);
        expect((page as any)[method as string]).toHaveBeenCalledWith(...args as any[]);
    });

    it('uploads a file after the chooser and click complete', async () => {
        const chooser = { setFiles: vi.fn() };
        page.waitForEvent.mockResolvedValue(chooser);
        const { playwrigthDoAction } = await import('../src/config.js');
        await playwrigthDoAction[PlaywrightCommandType.UPLOAD]({ selector: '#file', filePaths: ['/tmp/a.txt'] } as any, page as unknown as Page);
        expect(page.waitForEvent).toHaveBeenCalledWith('filechooser');
        expect(page.click).toHaveBeenCalledWith('#file');
        expect(chooser.setFiles).toHaveBeenCalledWith(['/tmp/a.txt']);
    });

    it('scrolls to a selector or to page coordinates', async () => {
        const { playwrigthDoAction } = await import('../src/config.js');
        const locator = { scrollIntoViewIfNeeded: vi.fn() };
        page.locator.mockReturnValue(locator);
        await playwrigthDoAction[PlaywrightCommandType.SCROLL]({ selector: '#footer' } as any, page as unknown as Page);
        expect(page.locator).toHaveBeenCalledWith('#footer');
        expect(locator.scrollIntoViewIfNeeded).toHaveBeenCalledOnce();

        await playwrigthDoAction[PlaywrightCommandType.SCROLL]({ x: 12, y: 40 } as any, page as unknown as Page);
        expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), { x: 12, y: 40 });
        const scroll = page.evaluate.mock.calls[0][0] as (coordinates: { x: number; y: number }) => void;
        const scrollTo = vi.fn();
        vi.stubGlobal('window', { scrollTo });
        scroll({ x: 12, y: 40 });
        expect(scrollTo).toHaveBeenCalledWith({ left: 12, top: 40, behavior: 'instant' });
        vi.unstubAllGlobals();
    });

    it.each([
        [PlaywrightCommandType.NAVIGATE, {}], [PlaywrightCommandType.CLICK, {}], [PlaywrightCommandType.FILL, { selector: '#x' }],
        [PlaywrightCommandType.PRESS, { selector: '#x' }], [PlaywrightCommandType.HOVER, {}], [PlaywrightCommandType.FOCUS, {}],
        [PlaywrightCommandType.CHECK, {}], [PlaywrightCommandType.UNCHECK, {}], [PlaywrightCommandType.SELECT, { selector: '#x' }],
        [PlaywrightCommandType.UPLOAD, { selector: '#x' }], [PlaywrightCommandType.DRAG_AND_DROP, { sourceSelector: '#x' }],
        [PlaywrightCommandType.SCROLL, {}], [PlaywrightCommandType.WAIT, {}]
    ])('rejects an invalid %s payload', async (command, payload) => {
        const { playwrigthDoAction } = await import('../src/config.js');
        const subject = command === PlaywrightCommandType.NAVIGATE ? browser : page;
        await expect(playwrigthDoAction[command as PlaywrightCommandType](payload as any, subject as any))
            .rejects.toMatchObject({ code: CODES.INVALID_COMMAND });
    });
});
