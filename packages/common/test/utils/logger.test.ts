/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
    describe,
    it,
    expect,
    vi,
    beforeEach
} from 'vitest';
import pino from 'pino';

import { Logger, VeloError } from '../../src/index.js';

vi.mock('pino');

describe('Logger', () => {
    const traceMock = vi.fn();
    const debugMock = vi.fn();
    const infoMock = vi.fn();
    const warnMock = vi.fn();
    const errorMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(pino).mockReturnValue({
            trace: traceMock,
            debug: debugMock,
            info: infoMock,
            warn: warnMock,
            error: errorMock,
        } as any);
    });

    it('should create a pino logger using default level', () => {
        delete process.env.LOG_LEVEL;
        new Logger();
        expect(pino).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'info',
            })
        );
    });
    
    it('should create a pino logger using LOG_LEVEL environment variable', () => {
        process.env.LOG_LEVEL = 'debug';
        new Logger();
        expect(pino).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'debug',
            })
        );
    });

    it('should write a trace log', () => {
        const logger = new Logger();
        logger.trace('TestClass', 'testMethod', 'This is a trace log');
        expect(traceMock).toHaveBeenCalledWith({ className: 'TestClass', methodName: 'testMethod' }, 'This is a trace log');
    });

    it('should write a debug log', () => {
        const logger = new Logger();
        logger.debug('TestClass', 'testMethod', 'This is a debug log');
        expect(debugMock).toHaveBeenCalledWith({ className: 'TestClass', methodName: 'testMethod' }, 'This is a debug log');
    });

    it('should write an info log', () => {
        const logger = new Logger();
        logger.info('TestClass', 'testMethod', 'This is an info log');
        expect(infoMock).toHaveBeenCalledWith({ className: 'TestClass', methodName: 'testMethod' }, 'This is an info log');
    });

    it('should write a warn log', () => {
        const logger = new Logger();
        const code = { id: 'WARN001', description: 'This is a warning' };
        logger.warn('TestClass', 'testMethod', 'This is a warn log', code);
        expect(warnMock).toHaveBeenCalledWith({ className: 'TestClass', methodName: 'testMethod', type: { ...code } }, 'This is a warn log');
    });

    it('should write an error log using explicit code', () => {
        const logger = new Logger();
        const code = { id: 'ERR001', description: 'This is an error' };
        const error = new Error('Test error');
        logger.error('TestClass', 'testMethod', error, code);
        expect(errorMock).toHaveBeenCalledWith({ className: 'TestClass', methodName: 'testMethod', err: error, type: { ...code } });
    });

    it('should write an error log with the code from the error object', () => {
        const logger = new Logger();
        const code = { id: 'ERR001', description: 'This is an error' };
        const error = new VeloError(code, 'Test VeloError');
        logger.error('TestClass', 'testMethod', error);
        expect(errorMock).toHaveBeenCalledWith({ className: 'TestClass', methodName: 'testMethod', err: error, type: { ...code } });
    });

    it('should write an error log with undefined code if error is not a VeloError and no code is provided', () => {
        const logger = new Logger();
        const error = new Error('Test error');
        logger.error('TestClass', 'testMethod', error);
        expect(errorMock).toHaveBeenCalledWith({ className: 'TestClass', methodName: 'testMethod', err: error, type: undefined });
    });
});
