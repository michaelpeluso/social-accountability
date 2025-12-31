module.exports = {
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  overrides: [
    {
      // Allow console in logger and tests
      files: ['**/logger.ts', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'expo/no-dynamic-env-var': 'off', // Allow dynamic env access in config files
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
