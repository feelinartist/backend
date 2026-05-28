import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    silent: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vitest.setup.ts',
        'vitest.config.ts',
        '**/index.ts',
        '**/*.types.ts',
        'src/domain/entities/user.ts',
        'src/domain/repositories/**'
      ]
    }
  },
});
