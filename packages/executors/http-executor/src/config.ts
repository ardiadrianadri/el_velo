import type { Code } from '@el_velo/common';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface HttpCommand {
  url: string;
  host: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export interface HttpResult {
  status: number;
  headers: Record<string, string>;
  body: Record<string, any>;
}

export const CODES: Record<string, Code> = {
    SUCCESS: {
        id: '0000',
        description: 'Command executed successfully.',
    },
    HTTP_REQUEST_FAILED: {
        id: '2001',
        description: 'Failed to execute HTTP request.',
    },
    ENVIRONMENT_TIMEOUT: {
        id: '2002',
        description: 'Timeout occurred while waiting for environment to start.',
    }
};