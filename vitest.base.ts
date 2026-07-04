import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,

    environment: 'node',

    include: [
      'test/**/*.test.ts'
    ],

    exclude: [
      'node_modules',
      'dist',
      'coverage'
    ],

    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'html',
        'json'
      ],

      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      reportsDirectory: './coverage'
    }
  }
});