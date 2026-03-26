import { defineConfig } from 'oxlint'

/* oxlint-disable no-default-export */
export default defineConfig({
  ignorePatterns: [
    // ignore configuration example file from lint
    'src/cli/assets/*.ts',
  ],
  categories: { correctness: 'error' },
  plugins: ['eslint', 'oxc', 'node', 'typescript', 'unicorn', 'import', 'vitest'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error', // Or "error"
      { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'eslint/no-duplicate-imports ': ['error', { allowSeparateTypeImports: true }],
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    'import/no-default-export': 'error',
    'typescript/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
    'no-console': 'error',
    'import/extensions': ['error', 'never'],
    'unicorn/filename-case': ['error', { case: 'kebabCase' }],
  },
})
