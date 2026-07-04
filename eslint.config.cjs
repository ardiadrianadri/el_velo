/* eslint-disable no-undef */
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],

    languageOptions: {
      parserOptions: {
        project: ['./packages/**/tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],

      semi: ['error', 'always'],

      eqeqeq: ['error', 'always'],

      curly: ['error', 'all'],

      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      "@typescript-eslint/restrict-template-expressions": 'off'
    },
  }
);
