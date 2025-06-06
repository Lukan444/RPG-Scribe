/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupVitest.ts'],
    css: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        isolate: true,
        execArgv: ['--max-old-space-size=8192']
      }
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupVitest.ts',
        'src/tests/setup/',
        'src/tests/__mocks__/',
        'src/tests/utils/',
        'src/reportWebVitals.ts',
        'src/index.tsx',
        'src/react-app-env.d.ts',
      ],
    },
    include: ['src/**/*.{test,spec,vitest}.{js,jsx,ts,tsx}', 'functions/src/**/*.{test,spec,vitest}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'build', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
