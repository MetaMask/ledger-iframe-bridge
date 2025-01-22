module.exports = {
  root: true,

  extends: ['@metamask/eslint-config'],

  overrides: [
    {
      files: ['*.js'],
      parserOptions: {
        sourceType: 'script',
      },
      extends: ['@metamask/eslint-config-nodejs'],
    },
  ],

  ignorePatterns: [
    'vite.config.js',
    '.eslintrc.cjs',
    '.prettierrc.cjs',
    'node_modules',
    'dist/',
    'docs/',
    '.yarn/',
  ],

  parserOptions: {
    sourceType: 'module',
  }
};
