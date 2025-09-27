/**
 * Vitest Configuration
 * Test runner configuration for unit and integration tests
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Global test APIs
    globals: true,

    // Setup files
    setupFiles: './src/test/setup.ts',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '.next/',
        'coverage/',
        '*.config.ts',
        '*.config.js',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },

    // Test matching patterns
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Excluded files
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      '.idea',
      '.git',
      '.cache',
    ],

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Reporter
    reporters: ['default'],
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/mocks': path.resolve(__dirname, './src/mocks'),
      '@/test': path.resolve(__dirname, './src/test'),
    },
  },

  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.next/**', '**/coverage/**'],
    },
  },

})
