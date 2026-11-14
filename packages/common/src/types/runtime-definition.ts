import type { Environment, Service } from './index.js';
import type { VeloError } from './veloError.js';

/**
 * TEST DEFINITION TYPES
 */

export enum CLI_ACTIONS {
    RUN_COMMAND = 'run-command',
    WRITE_FILE = 'write-file',
    READ_FILE = 'read-file',
    CHECK_PROCESS = 'check-process',
};

export enum HTTP_ACTIONS {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete'
};

export enum PLAYWRIGHT_ACTIONS {
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

export enum EXECUTOR_TYPE {
    CLI = 'cli',
    HTTP = 'http',
    PLAYWRIGHT = 'playwright'
}

export enum OPERATORS {
    EQUALS = 'equals',
    NOT_EQUALS = 'not-equals',
    CONTAINS = 'contains',
    NOT_CONTAINS = 'not-contains',
    MATCHES = 'matches',
    GREATER_THAN = 'greater-than',
    LESS_THAN = 'less-than',
    EXISTS = 'exists',
    NOT_EXISTS = 'not-exists',
    IS_EMPTY = 'is-empty',
    IS_NOT_EMPTY = 'is-not-empty',
}

export type JSONValue = string | number | boolean | null | JSONObject | JSONValue[];
export interface JSONObject {
    [key: string]: JSONValue;
}

export interface RunCommandAction {
    type: CLI_ACTIONS.RUN_COMMAND;
    command: string[];
}

export interface WriteFileAction {
    type: CLI_ACTIONS.WRITE_FILE;
    filePath: string;
    content: string;
}

export interface ReadFileAction {
    type: CLI_ACTIONS.READ_FILE;
    filePath: string;
}

export interface CheckProcessAction {
    type: CLI_ACTIONS.CHECK_PROCESS;
    processName: string;
}

export interface GetAction {
    type: HTTP_ACTIONS.GET;
    url: string;
    headers?: Record<string, string>;
}

export interface PostAction {
    type: HTTP_ACTIONS.POST;
    url: string;
    body: JSONValue;
    headers?: Record<string, string>;
}

export interface PutAction {
    type: HTTP_ACTIONS.PUT;
    url: string;
    body: JSONValue;
    headers?: Record<string, string>;
}

export interface DeleteAction {
    type: HTTP_ACTIONS.DELETE;
    url: string;
    headers?: Record<string, string>;
}

export interface NavigateAction {
    type: PLAYWRIGHT_ACTIONS.NAVIGATE;
    url: string;
}

export interface ClickAction {
    type: PLAYWRIGHT_ACTIONS.CLICK;
    selector: string;
}

export interface FillAction {
    type: PLAYWRIGHT_ACTIONS.FILL;
    selector: string;
    value: string;
}

export interface PressAction {
    type: PLAYWRIGHT_ACTIONS.PRESS;
    selector: string;
    key: string;
}

export interface HoverAction {
    type: PLAYWRIGHT_ACTIONS.HOVER;
    selector: string;
}

export interface FocusAction {
    type: PLAYWRIGHT_ACTIONS.FOCUS;
    selector: string;
}

export interface CheckAction {
    type: PLAYWRIGHT_ACTIONS.CHECK;
    selector: string;
}

export interface UncheckAction {
    type: PLAYWRIGHT_ACTIONS.UNCHECK;
    selector: string;
}

export interface SelectAction {
    type: PLAYWRIGHT_ACTIONS.SELECT;
    selector: string;
    values: string[];
}

export interface UploadAction {
    type: PLAYWRIGHT_ACTIONS.UPLOAD;
    selector: string;
    filePaths: string[];
}

export interface DragAndDropAction {
    type: PLAYWRIGHT_ACTIONS.DRAG_AND_DROP;
    sourceSelector: string;
    targetSelector: string;
}

export type ScrollAction = {
    type: PLAYWRIGHT_ACTIONS.SCROLL;
    selector: string;
    x?: never;
    y?: never;
} | {
    type: PLAYWRIGHT_ACTIONS.SCROLL;
    x: number;
    y: number;
    selector?: never;
}

export interface WaitAction {
    type: PLAYWRIGHT_ACTIONS.WAIT;
    selector: string;
    timeout?: number;
}

export type cliAction = RunCommandAction | WriteFileAction | ReadFileAction | CheckProcessAction;
export type httpAction = GetAction | PostAction | PutAction | DeleteAction;
export type playwrightAction = NavigateAction | ClickAction | FillAction | PressAction | HoverAction | FocusAction | CheckAction | UncheckAction | SelectAction | UploadAction | DragAndDropAction | ScrollAction | WaitAction;

export interface Step {
    id: string;
    description: string;
}

export interface StepCli extends Step {
    action: cliAction;
}

export interface StepHttp extends Step {
    action: httpAction;
}

export interface StepPlaywright extends Step {
    action: playwrightAction;
}

export interface StepGroupCli {
    id: string;
    description: string;
    executor: EXECUTOR_TYPE.CLI;
    steps: (StepCli | StepGroupCli)[];
}

export interface StepGroupHttp {
    id: string;
    description: string;
    executor: EXECUTOR_TYPE.HTTP;
    steps: (StepHttp | StepGroupHttp)[];
}

export interface StepGroupPlaywright {
    id: string;
    description: string;
    executor: EXECUTOR_TYPE.PLAYWRIGHT;
    steps: (StepPlaywright | StepGroupPlaywright)[];
}

export type StepsGroup = StepGroupCli | StepGroupHttp | StepGroupPlaywright;

export interface Context {
    id: string;
    description: string;
    dockerComposeFilePath: string;
}

export interface ExpectationBase {
    id: string;
    description: string;
    property: string;
}

export interface ExpectationWithExpectedValue extends ExpectationBase {
    operator: OPERATORS.EQUALS | OPERATORS.NOT_EQUALS | OPERATORS.CONTAINS | OPERATORS.NOT_CONTAINS | OPERATORS.MATCHES | OPERATORS.GREATER_THAN | OPERATORS.LESS_THAN;
    expected?: JSONValue;
}

export interface ExpectationWithNoExpectedValue extends ExpectationBase {
    operator: OPERATORS.EXISTS | OPERATORS.NOT_EXISTS | OPERATORS.IS_EMPTY | OPERATORS.IS_NOT_EMPTY;
    expected?: never;
}

export type Expectation = ExpectationWithExpectedValue | ExpectationWithNoExpectedValue;

export interface TestDefinition {
    id: string;
    description: string;
    tags: string[];
    steps: StepsGroup;
    context: Context;
    expectations: Expectation[];
}

export interface TestPlan {
    id: string;
    description: string;
    tags: string[];
    tests: TestDefinition[];
    plugins?: {
        beforeRun?: VeloPluginConfig[];
        beforeTest?: VeloPluginConfig[];
        afterTest?: VeloPluginConfig[];
        afterRun?: VeloPluginConfig[];
    };
}

/**
 * RESULT DEFINITION TYPES
 */

export interface StepResult {
    stepId: string;
    status: 'PASS' | 'FAIL';
    error?: VeloError;
    timeTakenMs: number;
}

export interface ValidationResult {
    expectationId: string;
    status: 'PASS' | 'FAIL' | 'NOT_EVALUATED';
    message: string;
}

export interface TestResult {
    testId: string;
    status: 'PASS' | 'FAIL' | 'SKIPPED';
    stepsResult: StepResult[];
    validationResults: ValidationResult[];
    timeTakenMs: number;
}

export interface TestPlanResult {
    testPlanId: string;
    status: 'PASS' | 'FAIL' | 'SKIPPED';
    testsResult: TestResult[];
    timeTakenMs: number;
}

export interface PluginError {
    pluginPackage: string;
    hook: 'beforeRun' | 'beforeTest' | 'afterTest' | 'afterRun';
    testPlanId: string;
    testId?: string;
    message: string;
    error?: VeloError;
}

export interface RunnerResult {
    runnerId: string;
    status: 'PASS' | 'FAIL';
    testPlansResult: TestPlanResult[];
    pluginErrors: PluginError[];
    timeTakenMs: number;
}

/**
 * CONFIG DEFINITION TYPES
 */

export interface RunnerPaths {
    vtsPath: string;
    dockerComposePath: string;
    resultsPath: string;
}

export interface RunnerTimeouts {
    testTimeoutMs: number;
    runTimeoutMs: number;
}

export enum ReportsType {
    JSON = 'json',
    CSV = 'csv',
}

export interface RunnerConfig {
    id: string;
    description: string;
    excludeTestTags?: string;
    excludeTestPlanTags?: string;
    maxParallelTests: number;
    paths: RunnerPaths;
    timeouts: RunnerTimeouts;
    reportsType: ReportsType[];
}

export type Immutable<T> =
    T extends (...args: never[]) => unknown
    ? T
    : T extends readonly (infer U)[]
    ? readonly Immutable<U>[]
    : T extends object
    ? { readonly [P in keyof T]: Immutable<T[P]> }
    : T;

export interface PluginEnvironment {
    readonly endpoint: string;
    readonly exec: Environment['exec'];
}

export interface VeloPluginBeforeRun {
    run(pluginConfig: JSONObject): Promise<Service[]>;
}

export interface VeloPluginBeforeTest {
    run(environment: PluginEnvironment, test: Immutable<TestDefinition>, pluginConfig: JSONObject): Promise<void>;
}

export interface VeloPluginAfterTest {
    run(environment: PluginEnvironment, test: Immutable<TestDefinition>, result: Immutable<TestResult>, pluginConfig: JSONObject): Promise<void>;
}

export interface VeloPluginAfterRun {
    run(testPlan: Immutable<TestPlan>, results: readonly Immutable<TestResult>[], reportsPath: string, pluginConfig: JSONObject): Promise<void>;
}

export interface VeloPluginConfig {
    package: string;
    enabled: boolean;
    options?: JSONObject;
}