import { Code } from './types.js';

export const CODES: Record<string, Code> = {
    SUCCESS: {
        id: '0000',
        description: 'Operation completed successfully.',
    },
    ENTRYPOINT_NOT_FOUND: {
        id: '1001',
        description: 'The entrypoint container was not found in the services list.',
    },
    SERVICE_START_FAILURE: {
        id: '1002',
        description: 'Failed to start one or more services.',
    },
    SERVICE_STOP_FAILURE: {
        id: '1003',
        description: 'Failed to stop one or more services.',
    },
    COMMAND_EXECUTION_FAILURE: {
        id: '1004',
        description: 'Failed to execute command in the environment.',
    },
}