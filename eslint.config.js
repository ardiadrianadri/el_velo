module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
  },

  env: {
    node: true,
    es2023: true,
  },

  plugins: [
    '@typescript-eslint',
    'import',
  ],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:@typescript-eslint/stylistic',
    'prettier',
  ],

  rules: {
    //
    // Tu preferencia
    //
    'quotes': [
      'error',
      'single',
      {
        avoidEscape: true,
      },
    ],

    'semi': [
      'error',
      'always',
    ],

    //
    // Imports
    //
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      },
    ],

    //
    // Buenas prácticas
    //
    'eqeqeq': [
      'error',
      'always',
    ],

    'curly': [
      'error',
      'all',
    ],

    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'],
      },
    ],

    '@typescript-eslint/explicit-function-return-type': 'error',

    '@typescript-eslint/consistent-type-imports': 'error',

    '@typescript-eslint/no-floating-promises': 'error',

    '@typescript-eslint/no-misused-promises': 'error',
  },
};