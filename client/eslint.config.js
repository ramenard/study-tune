// @ts-check
const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');

module.exports = tseslint.config(
  {
    ignores: ['src/app/api/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    plugins: {
      '@angular-eslint': angular,
      '@angular-eslint/template': angularTemplate,
    },
    processor: '@angular-eslint/template/extract-inline-html',
    rules: {
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/use-pipe-transform-interface': 'error',
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' }
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' }
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      'no-console': ['warn', { allow: ['error'] }],
    },
  },
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    languageOptions: {
      parser: templateParser,
    },
    rules: {
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/use-track-by-function': 'warn',
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/valid-aria': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
    },
  },
);