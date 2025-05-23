/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'lib/',
        'src/tests/',
      ],
    },
    include: ['src/tests/vitest/**/*.vitest.{js,ts}', 'src/tests/vitest/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'lib'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
