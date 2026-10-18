import type { CheckCommandPayload, ClickCommandPayload, DragAndDropCommandPayload, FillCommandPayload, FocusCommandPayload, HoverCommandPayload, NavigateCommandPayload, PlaywrightCommandPayload, PressCommandPayload, ScrollCommandPayload, SelectCommandPayload, UncheckCommandPayload, UploadCommandPayload, WaitCommandPayload} from '@el_velo/common';
import { PlaywrightCommandType, VeloError, type Code } from '@el_velo/common';
import type { Browser, Page } from 'playwright';

export const CODES: Record<string, Code> = {
    SUCCESS: {
        id: '0000',
        description: 'Command executed successfully.',
    },
    INVALID_CONFIGURATION: {
        id: '0001',
        description: 'Invalid configuration provided.',
    },
    ENVIRONMENT_TIMEOUT: {
        id: '0002',
        description: 'Timeout occurred while waiting for environment to start.',
    },
    INVALID_COMMAND: {
        id: '0003',
        description: 'Invalid command provided.',
    },
    ERROR_EXECUTING_COMMAND: {
        id: '0004',
        description: 'Error occurred while executing command.',
    },
};


export const PlayloadExtractor = {
    [PlaywrightCommandType.NAVIGATE]: (payload: PlaywrightCommandPayload): NavigateCommandPayload => {
        if ('url' in payload) {
            return payload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for NAVIGATE. Expected a NavigateCommandPayload with a valid URL.');
        throw newError;
    },
    [PlaywrightCommandType.CLICK]: (payload: PlaywrightCommandPayload): ClickCommandPayload => {
        if ('selector' in payload) {
            return payload as ClickCommandPayload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for CLICK. Expected a ClickCommandPayload with a valid selector.');
        throw newError;
    },
    [PlaywrightCommandType.FILL]: (payload: PlaywrightCommandPayload): FillCommandPayload => {
        if ('selector' in payload && 'value' in payload) {
            return payload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for FILL. Expected a FillCommandPayload with a valid selector and value.');
        throw newError;
    },
    [PlaywrightCommandType.PRESS]: (payload: PlaywrightCommandPayload): PressCommandPayload => {
        if ('selector' in payload && 'key' in payload) {
            return payload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for PRESS. Expected a PressCommandPayload with a valid selector and key.');
        throw newError;
    },
    [PlaywrightCommandType.HOVER]: (payload: PlaywrightCommandPayload): HoverCommandPayload => {
        if ('selector' in payload) {
            return payload as HoverCommandPayload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for HOVER. Expected a HoverCommandPayload with a valid selector.');
        throw newError;
    },
    [PlaywrightCommandType.FOCUS]: (payload: PlaywrightCommandPayload): FocusCommandPayload => {
        if ('selector' in payload) {
            return payload as FocusCommandPayload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for FOCUS. Expected a FocusCommandPayload with a valid selector.');
        throw newError;
    },
    [PlaywrightCommandType.CHECK]: (payload: PlaywrightCommandPayload): CheckCommandPayload => {
        if ('selector' in payload) {
            return payload as CheckCommandPayload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for CHECK. Expected a CheckCommandPayload with a valid selector.');
        throw newError;
    },
    [PlaywrightCommandType.UNCHECK]: (payload: PlaywrightCommandPayload): UncheckCommandPayload => {
        if ('selector' in payload) {
            return payload as UncheckCommandPayload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for UNCHECK. Expected an UncheckCommandPayload with a valid selector.');
        throw newError;
    },
    [PlaywrightCommandType.SELECT]: (payload: PlaywrightCommandPayload): SelectCommandPayload => {
        if ('selector' in payload && 'values' in payload) {
            return payload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for SELECT. Expected a SelectCommandPayload with a valid selector and values.');
        throw newError;
    },
    [PlaywrightCommandType.UPLOAD]: (payload: PlaywrightCommandPayload): UploadCommandPayload => {
        if ('selector' in payload && 'filePaths' in payload) {
            return payload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for UPLOAD. Expected an UploadCommandPayload with a valid selector and filePaths.');
        throw newError;
    },
    [PlaywrightCommandType.DRAG_AND_DROP]: (payload: PlaywrightCommandPayload): DragAndDropCommandPayload => {
        if ('sourceSelector' in payload && 'targetSelector' in payload) {
            return payload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for DRAG_AND_DROP. Expected a DragAndDropCommandPayload with valid sourceSelector and targetSelector.');
        throw newError;
    },
    [PlaywrightCommandType.SCROLL]: (payload: PlaywrightCommandPayload): ScrollCommandPayload => {
        if ('selector' in payload || 'x' in payload || 'y' in payload) {
            return payload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for SCROLL. Expected a ScrollCommandPayload with at least one of selector, x, or y.');
        throw newError;
    },
    [PlaywrightCommandType.WAIT]: (payload: PlaywrightCommandPayload): WaitCommandPayload => {
        if ('selector' in payload) {
            return payload as WaitCommandPayload;
        }
        const newError = new VeloError(CODES.INVALID_COMMAND, 'Invalid command payload for WAIT. Expected a WaitCommandPayload with a valid selector.');
        throw newError;
    }
};

export const playwrigthDoAction = {
    [PlaywrightCommandType.NAVIGATE]: async (payload: PlaywrightCommandPayload, browser: Browser): Promise<Page> => {
        const navigatePayload = PlayloadExtractor[PlaywrightCommandType.NAVIGATE](payload);
        const page = await browser.newPage();
        await page.goto(navigatePayload.url);
        return page;
    },
    [PlaywrightCommandType.CLICK]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const clickPayload = PlayloadExtractor[PlaywrightCommandType.CLICK](payload);
        await page.click(clickPayload.selector);
        return page;
    },
    [PlaywrightCommandType.FILL]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const fillPayload = PlayloadExtractor[PlaywrightCommandType.FILL](payload);
        await page.fill(fillPayload.selector, fillPayload.value);
        return page;
    },
    [PlaywrightCommandType.PRESS]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const pressPayload = PlayloadExtractor[PlaywrightCommandType.PRESS](payload);
        await page.press(pressPayload.selector, pressPayload.key);
        return page;
    },
    [PlaywrightCommandType.HOVER]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const hoverPayload = PlayloadExtractor[PlaywrightCommandType.HOVER](payload);
        await page.hover(hoverPayload.selector);
        return page;
    },
    [PlaywrightCommandType.FOCUS]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const focusPayload = PlayloadExtractor[PlaywrightCommandType.FOCUS](payload);
        await page.focus(focusPayload.selector);
        return page;
    },
    [PlaywrightCommandType.CHECK]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const checkPayload = PlayloadExtractor[PlaywrightCommandType.CHECK](payload);
        await page.check(checkPayload.selector);
        return page;
    },
    [PlaywrightCommandType.UNCHECK]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const uncheckPayload = PlayloadExtractor[PlaywrightCommandType.UNCHECK](payload);
        await page.uncheck(uncheckPayload.selector);
        return page;
    },
    [PlaywrightCommandType.SELECT]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const selectPayload = PlayloadExtractor[PlaywrightCommandType.SELECT](payload);
        await page.selectOption(selectPayload.selector, selectPayload.values);
        return page;
    },
    [PlaywrightCommandType.UPLOAD]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const uploadPayload = PlayloadExtractor[PlaywrightCommandType.UPLOAD](payload);
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click(uploadPayload.selector),
        ]);
        await fileChooser.setFiles(uploadPayload.filePaths);
        return page;
    },
    [PlaywrightCommandType.DRAG_AND_DROP]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const dragAndDropPayload = PlayloadExtractor[PlaywrightCommandType.DRAG_AND_DROP](payload);
        await page.dragAndDrop(dragAndDropPayload.sourceSelector, dragAndDropPayload.targetSelector);
        return page;
    },
    [PlaywrightCommandType.SCROLL]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const scrollPayload = PlayloadExtractor[PlaywrightCommandType.SCROLL](payload);
        if (scrollPayload.selector) {
            await page.locator(scrollPayload.selector).scrollIntoViewIfNeeded();
        } else {
            await page.evaluate(({ x, y }) => {
                window.scrollTo({
                    left: x,
                    top: y,
                    behavior: 'instant'
                });
            }, { x: scrollPayload.x, y: scrollPayload.y });
        }
        return page;
    },
    [PlaywrightCommandType.WAIT]: async (payload: PlaywrightCommandPayload, page: Page): Promise<Page> => {
        const waitPayload = PlayloadExtractor[PlaywrightCommandType.WAIT](payload);
        await page.waitForSelector(waitPayload.selector);
        return page;
    }
};
