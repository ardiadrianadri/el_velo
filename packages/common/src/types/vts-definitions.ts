import type { 
    CLI_ACTIONS,
    HTTP_ACTIONS,
    PLAYWRIGHT_ACTIONS,
    EXECUTOR_TYPE,
    OPERATORS,
    JSONValue,
    JSONObject,
} from './runtime-definition.js';

export interface VTSCommandAction {
    type: CLI_ACTIONS.RUN_COMMAND;
    command: string;
}

export interface VTSWriteFileAction {
    type: CLI_ACTIONS.WRITE_FILE;
    filePath: string;
    content: string;
}

export interface VTSReadFileAction {
    type: CLI_ACTIONS.READ_FILE;
    filePath: string;
}

export interface VTSCheckProcessAction {
    type: CLI_ACTIONS.CHECK_PROCESS;
    processName: string;
}

export interface VTSGetAction {
    type: HTTP_ACTIONS.GET;
    url: string;
    headers?: Record<string, string>;
}

export interface VTSPostAction {
    type: HTTP_ACTIONS.POST;
    url: string;
    body: JSONValue;
    headers?: Record<string, string>;
}

export interface VTSPutAction {
    type: HTTP_ACTIONS.PUT;
    url: string;
    body: JSONValue;
    headers?: Record<string, string>;
}

export interface VTSDeleteAction {
    type: HTTP_ACTIONS.DELETE;
    url: string;
    headers?: Record<string, string>;
}

export interface VTSNavigateAction {
    type: PLAYWRIGHT_ACTIONS.NAVIGATE;
    url: string;
}

export interface VTSClickAction {
    type: PLAYWRIGHT_ACTIONS.CLICK;
    selector: string;
}

export interface VTSFillAction {
    type: PLAYWRIGHT_ACTIONS.FILL;
    selector: string;
    value: string;
}

export interface VTSPressAction {
    type: PLAYWRIGHT_ACTIONS.PRESS;
    selector: string;
    key: string;
}

export interface VTSHoverAction {
    type: PLAYWRIGHT_ACTIONS.HOVER;
    selector: string;
}

export interface VTSFocusAction {
    type: PLAYWRIGHT_ACTIONS.FOCUS;
    selector: string;
}

export interface VTSCheckAction {
    type: PLAYWRIGHT_ACTIONS.CHECK;
    selector: string;
}

export interface VTSUncheckAction {
    type: PLAYWRIGHT_ACTIONS.UNCHECK;
    selector: string;
}

export interface VTSSelectAction {
    type: PLAYWRIGHT_ACTIONS.SELECT;
    selector: string;
    value: string | string[];
}

export interface VTSUploadAction {
    type: PLAYWRIGHT_ACTIONS.UPLOAD;
    selector: string;
    filePaths: string[];
}

export interface VTSDragAndDropAction {
    type: PLAYWRIGHT_ACTIONS.DRAG_AND_DROP;
    sourceSelector: string;
    targetSelector: string;
}

export type VTSSCrollAction = {
    type: PLAYWRIGHT_ACTIONS.SCROLL;
    selector: string;
    x?: never;
    y?: never;
} | {
    type: PLAYWRIGHT_ACTIONS.SCROLL;
    selector?: never;
    x: number;
    y: number;
};

export type VTSCliActions = VTSCommandAction | VTSWriteFileAction | VTSReadFileAction | VTSCheckProcessAction;
export type VTSHttpActions = VTSGetAction | VTSPostAction | VTSPutAction | VTSDeleteAction;
export type VTSPlaywrightActions = VTSNavigateAction | VTSClickAction | VTSFillAction | VTSPressAction | VTSHoverAction | VTSFocusAction | VTSCheckAction | VTSUncheckAction | VTSSelectAction | VTSUploadAction | VTSDragAndDropAction | VTSSCrollAction | VTSWaitAction;

export interface VTSWaitAction {
    type: PLAYWRIGHT_ACTIONS.WAIT;
    selector: string;
    timeout?: number;
}

export interface VTSStep {
    id: string;
    description: string;
}

export interface VTSCliStep extends VTSStep {
    action: VTSCliActions;
}

export interface VTSHttpStep extends VTSStep {
    action: VTSHttpActions;
}

export interface VTSPlaywrightStep extends VTSStep {
    action: VTSPlaywrightActions;
}

export interface VTSStepGroup {
    id: string;
    description: string;
    executor: EXECUTOR_TYPE;
    stepRefs: string[];
}

export interface VTSContext {
    id: string;
    description: string;
    dockerComposeFilePath: string;
}

export interface VTSExpectationBase {
    id: string;
    description: string;
    property: string;
}

export interface VTSExpectationWithExpected extends VTSExpectationBase {
    operator: OPERATORS.EQUALS | OPERATORS.NOT_EQUALS | OPERATORS.CONTAINS | OPERATORS.NOT_CONTAINS | OPERATORS.MATCHES | OPERATORS.GREATER_THAN | OPERATORS.LESS_THAN;
    expected: JSONValue;
}

export interface VTSExpectationWithoutExpected extends VTSExpectationBase {
    operator: OPERATORS.EXISTS | OPERATORS.NOT_EXISTS | OPERATORS.IS_EMPTY | OPERATORS.IS_NOT_EMPTY;
    expected?: never;
}

export type VTSExpectation = VTSExpectationWithExpected | VTSExpectationWithoutExpected;


export interface VTSTestDefinition {
    id: string;
    description: string;
    tags: string[];
    contextRef: string;
    stepsGroupRef: string;
    expectationsRefs: string[];
}

export interface VTSPluginConfig {
    package: string;
    enabled: boolean;
    options?: JSONObject;
}

export interface VTSTestPlan {
    id: string;
    description: string;
    tags: string[];
    testsRefs: string[];
    plugins?: {
        beforeRun?: VTSPluginConfig[];
        beforeTest?: VTSPluginConfig[];
        afterTest?: VTSPluginConfig[];
        afterRun?: VTSPluginConfig[];
    }
}
