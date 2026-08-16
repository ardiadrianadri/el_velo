import type { Result, CommandResult } from '@el_velo/common';

import { describe, expect,it, vi} from 'vitest';
import { ExecutorCli } from '../src/executorCli.js';
import { environmentMock } from './mocks';

describe('ExecutorCli', () => {
    it('should execute a command and return the result', async () => {
        const executor: ExecutorCli = new ExecutorCli();
        const command = ['echo', 'Hello, World!'];
        const expectedResult: Result<CommandResult> = {
            code: {
                id: '0000',
                description: 'Success'
            },
            payload: {
                stdout: 'Hello, World!\n',
                stderr: '',
                exitCode: 0,
                durationMs: 10
            }
        };
        // Mock the exec method to return the expected result
        environmentMock.exec = vi.fn().mockResolvedValue(expectedResult);

        const result = await executor.execute(command, environmentMock);

        expect(environmentMock.exec).toHaveBeenCalledWith(command);
        expect(result).toEqual(expectedResult);
    });
});