import { Code } from './codes.js';

/**
 * All the methods in el velo return a Result object as response. 
 * The Result object gets a Code object that describes the type of response
 * and a payload that contains the actual data of the response.
 */
export interface Result<T> {
    code: Code;
    payload: T;
}