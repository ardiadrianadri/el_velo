import type { Code } from '@el_velo/common';
import type { Schema } from '@cfworker/json-schema';

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
    INVALID_VOLUME_PATH: {
        id: '1011',
        description: 'The provided path is not valid'
    },
    MAPPED_PORT_IS_NOT_EXPOSED: {
        id: '1014',
        description: 'The mapped port is not exposed'
    },
    INVALID_SERVICE_CONFIGURATION: {
        id: '1015',
        description: 'The s'
    },
    SOCAT_STOP_FAILED: {
        id: '1016',
        description: 'Failed to stop the socat container.'
    },
    CONTAINER_STOP_FAILED: {
        id: '1017',
        description: 'Failed to stop the container.'
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

export const PORTS_REXP =
    /([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])/;

export const SERVICE_JSON_SCHEMA: Schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'docker-service-schema',
    title: 'docker-service',
    description: 'Schema that validates the service objet for docker environment',
    type: 'object',
    properties: {
        name: {
            description: 'Name of the container',
            type: 'string'
        },
        image: {
            description: 'Image to download from docker repository',
            type: 'string'
        },
        environment: {
            description: 'Record with the list of envirionment variables and its values that must be set in the container',
            type: 'object',
            minProperties: 1
        },
        command: {
            description: 'List of words that represent a console command that have to be run when the container starts',
            type: 'array',
            items: {
                type: 'string'
            },
            minItems: 1
        },
        exposePorts: {
            description: 'List of ports that the service expose to outside the container',
            type: 'array',
            items: {
                type: 'string',
                pattern: new RegExp(`^${PORTS_REXP.source}$`).source
            },
            minItems: 1
        },
        portsMapping: {
            description: 'List of mapping ports between the host and the container',
            type: 'array',
            items: {
                type: 'string',
                pattern: new RegExp(`^${PORTS_REXP.source}:${PORTS_REXP.source}$`).source
            },
            minItems: 1
        },
        volumes: {
            description: 'List of mapping paths between host and docker',
            type: 'array',
            items: {
                type: 'string',
                pattern: /^[^:]+:[^:]+(?::(?:rw|ro|z|Z))?$/.source
            },
            minItems: 1
        }
    },
    required: ['name', 'image']
};