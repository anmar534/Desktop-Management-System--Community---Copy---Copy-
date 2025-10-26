/* ESLint configuration: forbid direct localStorage usage in app code.
 * - Blocks 'localStorage' and 'window.localStorage' globally
 * - Allows in tests and mocks
 * - Allows in src/utils/storage.ts (guard implementation only)
 */

module.exports = {
  root: true,
  env: {
    es2021: true,
    browser: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'eslint-config-prettier'
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    'no-restricted-globals': [
      'error',
      {
        name: 'localStorage',
        message: 'Use storage.ts (safeLocalStorage/asyncStorage) or centralDataService instead of localStorage.'
      },
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'window',
        property: 'localStorage',
        message: 'Use storage.ts (safeLocalStorage/asyncStorage) or centralDataService instead of localStorage.'
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/consistent-generic-constructors': 'warn',
    '@typescript-eslint/prefer-function-type': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/triple-slash-reference': 'warn',
    '@typescript-eslint/prefer-includes': 'warn',
    '@typescript-eslint/consistent-type-definitions': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/consistent-indexed-object-style': 'warn',
    '@typescript-eslint/non-nullable-type-assertion-style': 'warn',
    '@typescript-eslint/no-empty-object-type': 'warn',
  '@typescript-eslint/no-unused-expressions': 'warn',
  '@typescript-eslint/dot-notation': 'warn',
  '@typescript-eslint/prefer-for-of': 'warn',
  'no-useless-escape': 'warn',
    'no-empty': 'warn',
    'no-case-declarations': 'warn',
    'prefer-const': 'warn',
  'react/prop-types': 'off',
  'react/display-name': 'warn',
  'react/no-unescaped-entities': 'warn',
    'react-hooks/rules-of-hooks': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-restricted-syntax': [
      'warn',
      {
        selector:
          "Literal[value=/\\b(?:bg|text|border|from|to|via|shadow|ring|stroke|fill)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-(?:[0-9]{2,3}))?\\b/]",
        message:
          'Use design-token utility classes (`bg-primary`, `text-muted-foreground`, etc.) instead of Tailwind raw color scale aliases.'
      },
      {
        selector:
          "TemplateElement[value.raw=/\\b(?:bg|text|border|from|to|via|shadow|ring|stroke|fill)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-(?:[0-9]{2,3}))?\\b/]",
        message:
          'Use design-token utility classes (`bg-primary`, `text-muted-foreground`, etc.) instead of Tailwind raw color scale aliases.'
      },
      {
        selector: "Literal[value=/\\b(?:bg|text|border|from|to|via|shadow|ring|stroke|fill)-\\[[^\\]]+\\]/]",
        message: 'Avoid arbitrary color values in Tailwind classes; expose them as tokens first.'
      },
      {
        selector:
          "TemplateElement[value.raw=/\\b(?:bg|text|border|from|to|via|shadow|ring|stroke|fill)-\\[[^\\]]+\\]/]",
        message: 'Avoid arbitrary color values in Tailwind classes; expose them as tokens first.'
      }
    ]
  },
  overrides: [
    {
      files: ['tests/**/*', 'src/__tests__/**/*', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'no-restricted-globals': 'off',
        'no-restricted-properties': 'off',
      },
    },
    {
      files: ['src/utils/storage.ts'],
      rules: {
        'no-restricted-globals': 'off',
        'no-restricted-properties': 'off',
      },
    },
    {
      files: ['*.cjs', '*.config.js', 'vite.config.ts', 'vitest.config.ts', 'postcss.config.js', 'tailwind.config.js'],
      env: {
        node: true
      },
      parserOptions: {
        project: null
      },
      rules: {
        // Disable ALL type-checked rules for config files (they require parserOptions.project)
        '@typescript-eslint/await-thenable': 'off',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-base-to-string': 'off',
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-for-in-array': 'off',
        '@typescript-eslint/no-implied-eval': 'off',
        '@typescript-eslint/no-meaningless-void-operator': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/no-throw-literal': 'off',
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/no-unnecessary-qualifier': 'off',
        '@typescript-eslint/no-unnecessary-type-arguments': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-enum-comparison': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/non-nullable-type-assertion-style': 'off',
        '@typescript-eslint/prefer-find': 'off',
        '@typescript-eslint/prefer-includes': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/prefer-optional-chain': 'off',
        '@typescript-eslint/prefer-readonly': 'off',
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        '@typescript-eslint/prefer-reduce-type-parameter': 'off',
        '@typescript-eslint/prefer-regexp-exec': 'off',
        '@typescript-eslint/prefer-return-this-type': 'off',
        '@typescript-eslint/prefer-string-starts-ends-with': 'off',
        '@typescript-eslint/promise-function-async': 'off',
        '@typescript-eslint/require-array-sort-compare': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/restrict-plus-operands': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/return-await': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/switch-exhaustiveness-check': 'off',
        '@typescript-eslint/unbound-method': 'off'
      }
    }
  ],
}
