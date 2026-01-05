import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      '*.config.{js,ts,mjs,cjs}',
      'next-env.d.ts',
      '.eslintrc.cjs',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      // Spacing and readability rules
      'padding-line-between-statements': [
        'error',
        // Require blank line after function declarations
        {
          blankLine: 'always',
          prev: 'function',
          next: '*',
        },
        // Require blank line before function declarations
        {
          blankLine: 'always',
          prev: '*',
          next: 'function',
        },
        // Require blank line after class declarations
        {
          blankLine: 'always',
          prev: 'class',
          next: '*',
        },
        // Require blank line before class declarations
        {
          blankLine: 'always',
          prev: '*',
          next: 'class',
        },
        // Require blank line after export declarations
        {
          blankLine: 'always',
          prev: 'export',
          next: '*',
        },
        // Require blank line before return statements
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        // Require blank line after variable declarations
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: '*',
        },
        // Allow no blank line between variable declarations
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],
      // Prevent multiple empty lines
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxEOF: 1,
          maxBOF: 0,
        },
      ],
      // Require newline at end of file
      'eol-last': ['error', 'always'],
      // Remove trailing spaces
      'no-trailing-spaces': 'error',
      // Object curly spacing
      'object-curly-spacing': ['error', 'always'],
      // Array bracket spacing
      'array-bracket-spacing': ['error', 'never'],
      // Computed property spacing
      'computed-property-spacing': ['error', 'never'],
      // Function paren spacing
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
    },
  },
];

export default eslintConfig;
