import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from '../../../vitest.base.ts';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./test/setup.ts'],
            coverage: {
                thresholds: {
                    lines: 95,
                    functions: 95,
                    branches: 90,
                    statements: 95,
                },
            },
        },
    })
);
