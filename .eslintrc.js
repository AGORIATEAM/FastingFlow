module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-native'],
  rules: {
    // Zero tolerance for console.log — blocked by pre-commit hook too
    'no-console': 'error',
    // Zero tolerance for `any`
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    // Enforce exhaustive type checking
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    // React hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // No hardcoded strings in JSX (i18n enforcement)
    'react-native/no-raw-text': ['error', { skip: [] }],
    // Other quality rules
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
  },
  overrides: [
    {
      files: ['scripts/**/*.ts'],
      rules: { 'no-console': 'off' },
      parserOptions: { project: './scripts/tsconfig.json' },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'babel.config.js',
    'metro.config.js',
    'tailwind.config.js',
  ],
};
