import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../../vitest.base.ts';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: [
                './test/setup.ts'
            ]
        }
    })
);