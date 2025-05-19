module.exports = {
  extends: ['../.eslintrc.cjs'],
  env: {
    jest: true,
  },
  rules: {
    // Relaxed rules for tests
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};