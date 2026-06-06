import { Code } from './codes.js';

/**
 * VeloError is a custom error class that extends the built-in Error class. It includes an additional property 'code' of type Code, which provides more context about the error that occurred. This allows for more structured error handling in the application.
 */
export class VeloError extends Error {

    /**
     * Velo Error constructor takes a Code object and a message string as parameters. The Code object provides an identifier and description for the error, while the message string gives a human-readable explanation of the error. The constructor calls the super() method to initialize the base Error class with the provided message.
     * @param code Code object that describes the type of error
     * @param message String that provides a human-readable explanation of the error
     */
  constructor(public code: Code, message: string) {
    super(message);
  }
}