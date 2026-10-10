export enum PlaywrightCommandType {
    NAVIGATE = 'navigate',
    CLICK = 'click',
    FILL = 'fill',
    PRESS = 'press',
    HOVER = 'hover',
    FOCUS = 'focus',
    CHECK = 'check',
    UNCHECK = 'uncheck',
    SELECT = 'select',
    UPLOAD = 'upload',
    DRAG_AND_DROP = 'dragAndDrop',
    SCROLL = 'scroll',
    WAIT = 'wait',
};

export interface PlaywrightCommand {
    type: PlaywrightCommandType;
    payload: PlaywrightCommandPayload;
}

export interface NavigateCommandPayload {
    url: string;
}

export interface ClickCommandPayload {
    selector: string;
}

export interface FillCommandPayload {
    selector: string;
    value: string;
}

export interface PressCommandPayload {
    selector: string;
    key: string;
}

export interface HoverCommandPayload {
    selector: string;
}

export interface FocusCommandPayload {
    selector: string;
}

export interface CheckCommandPayload {
    selector: string;
}

export interface UncheckCommandPayload {
    selector: string;
}

export interface SelectCommandPayload {
    selector: string;
    values: string[];
}

export interface UploadCommandPayload {
    selector: string;
    filePaths: string[];
}

export interface DragAndDropCommandPayload {
    sourceSelector: string;
    targetSelector: string;
}

export interface ScrollCommandPayload {
    selector?: string;
    x?: number;
    y?: number;
}

export interface WaitCommandPayload {
    selector: string;
}

export type PlaywrightCommandPayload =
    | NavigateCommandPayload
    | ClickCommandPayload
    | FillCommandPayload
    | PressCommandPayload
    | HoverCommandPayload
    | FocusCommandPayload
    | CheckCommandPayload
    | UncheckCommandPayload
    | SelectCommandPayload
    | UploadCommandPayload
    | DragAndDropCommandPayload
    | ScrollCommandPayload
    | WaitCommandPayload;

export interface PlaywrightResult {
    dom: string;
}

export enum PlaywrightConnectionType {
    SERVER = 'server',
    CDP = 'cdp',
}

export enum BrowserName {
    CHROMIUM = 'chromium',
    FIREFOX = 'firefox',
    WEBKIT = 'webkit',
}

export interface PlaywrightConnection {
    type: PlaywrightConnectionType;
    browser: BrowserName;
    url: string;
}

