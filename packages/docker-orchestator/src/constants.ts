import type { Code } from '@el_velo/common';

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
    COMMAND_EXECUTION_TIMEOUT: {
        id: '1005',
        description: 'Command execution timed out.',
    },
    ENVIRONMENT_ALREADY_STARTED: {
        id: '1006',
        description: 'The environment has already been started.',
    },
    ENVIRONMENT_NOT_STARTED: {
        id: '1007',
        description: 'The environment has not been started.',
    },
    NETWORK_STOP_FAILED: {
        id: '1008',
        description: 'Failed to stop the network.',
    },
    INVALID_VOLUME_CONFIGURATION: {
        id: '1009',
        description: 'Wrong volumen specification'
    },
    INVALID_VOLUME_MODE: {
        id: '1010',
        description: 'The volumen mode only accept as value "rw", "ro", "z" or "Z"'
    },
    INVALID_VOLUME_PATH: {
        id: '1011',
        description: 'The provided path is not valid'
    }
};

export enum  EnvironmentState {
    STOPPED = 'STOPPED',
    STARTING = 'STARTING',
    STARTED = 'STARTED',
    STOPPING = 'STOPPING',
    FAILED = 'FAILED',
}

export const DEFAULT_NETWORK = 'default_network';