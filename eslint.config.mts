import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['**/package-lock.json', '**/tsconfig.json', '**/vitest.config.ts', '**/*.config.ts'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: true,
      },
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    extends: [...tseslint.configs.recommendedTypeChecked],
  },

  eslintConfigPrettier,
]);
