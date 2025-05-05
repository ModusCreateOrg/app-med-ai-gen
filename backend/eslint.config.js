const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-plugin-prettier/recommended');
const js = require('@eslint/js');
const globals = require('globals');

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: [
      '.eslintrc.js',
      'node_modules/',
      'cdk.out/',
      'coverage/',
      'config/',
      '.vscode/',
      '.gitignore',
      '.prettierrc',
      '.prettierignore',
      '.eslintignore',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
