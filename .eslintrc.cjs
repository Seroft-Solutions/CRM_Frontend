module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
  plugins: ['prettier'],
  overrides: [
    {
      files: ['src/entity-library/components/**/*.{ts,tsx}', 'src/entity-library/hooks/**/*.{ts,tsx}'],
      rules: {
        'max-lines': [
          'error',
          {
            max: 200,
            skipBlankLines: true,
            skipComments: true,
          },
        ],
      },
    },
    {
      files: ['src/entity-library/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
  rules: {
    'prettier/prettier': 'error',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/entity-library/hooks', '@/entity-library/hooks/*', '@/entity-library/utils', '@/entity-library/utils/*'],
            message: 'Do not import internal entity-library hooks/utils; use the public API facades from @/entity-library instead.',
          },
          {
            group: ['@/entity-library/components/*/*', '@/entity-library/components/*/*/*'],
            message: 'Do not deep-import internal entity-library components; use @/entity-library or @/entity-library/components.',
          },
          {
            group: [
              '**/entity-library/components/**',
              '**/entity-library/hooks/**',
              '**/entity-library/utils/**',
              '**/entity-library/actions/**',
            ],
            message:
              'Do not import internal entity-library modules via relative paths; use @/entity-library public API entrypoints instead.',
          },
        ],
      },
    ],
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
};
