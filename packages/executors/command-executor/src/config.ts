import type { Code } from '@el_velo/common';

export const CODES: Record<string, Code> = {
    SUCCESS: {
        id: '0000',
        description: 'Command executed successfully.',
    },
    ENVIRONMENT_TIMEOUT: {
        id: '0001',
        description: 'Timeout occurred while waiting for environment to start.',
    }
};  