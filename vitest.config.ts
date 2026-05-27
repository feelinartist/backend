import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'prisma/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vitest.setup.ts',
        'vitest.config.ts',
        'src/main.ts',
        'src/app.module.ts'
      ]
    }
  },
});
