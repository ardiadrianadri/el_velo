import pino from 'pino';
import { Code } from '../types/codes.js';

/**
 * The Logger class is a wrapper around the pino logging library. 
 * It provides a simple interface for logging messages at different levels 
 * (info, error, debug, etc.). 
 * The logger level can be configured using the LOG_LEVEL environment variable.
 */
export class Logger {
    private logWriter: pino.Logger;

    constructor() {
        this.logWriter = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                },
            },
        });
    }

    /**
     * Method to write a trace, debug or info log
     * @param className Name of the clas where the log is being written
     * @param methodName Name of the method where the log is being written
     * @param level log level (trace, debug, info)
     * @param messsage log message
     */
    private writeLog(className: string, methodName: string, level: string, messsage: string) {
        (this.logWriter as any)[level]({ className, methodName }, messsage);
    }

    /**
     * Public method to write an trace log
     * @param className Name of the class where the log is being written
     * @param methodName Name of the method where the log is being written
     * @param message log message
     */
    trace(className: string, methodName: string, message: string) {
        this.writeLog(className, methodName, 'trace', message);
    }

    /**
     * Public method to write a debug log
     * @param className Name of the class where the log is being written
     * @param methodName Name of the method where the log is being written
     * @param message log message
     */
    debug(className: string, methodName: string, message: string) {
        this.writeLog(className, methodName, 'debug', message);
    }

    /**
     * Public method to write an info log
     * @param className Name of the class where the log is being written
     * @param methodName Name of the method where the log is being written
     * @param message log message
     */
    info(className: string, methodName: string, message: string) {
        this.writeLog(className, methodName, 'info', message);
    }

    /**
     * Public method to write a warn log.
     * @param className Name of the class where the log is being written
     * @param methodName Name of the method where the log is being written
     * @param message log message
     * @param code Code object that describes the type of warning.
     */
    warn(className: string, methodName: string, message: string, code: Code) {
        this.logWriter.warn({ className, methodName, type: { ...code }}, message);
    }

    /**
     * Public method to write an error log.
     * @param className Name of the class where the log is being written
     * @param methodName Name of the method where the log is being written
     * @param error VeloError object containing error details
     * @param code Code object that describes the type of error.
     */
    error(className: string, methodName: string, error: Error, code?: Code) {
        this.logWriter.error({ className, methodName, err: error, type: code ? {...code} : (error as any)?.code ? {...(error as any).code } : undefined });
    }
}
