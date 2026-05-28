import { describe, expect, it, vi } from 'vitest';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('registers auth and upload rate limiters', () => {
    const forRoutes = vi.fn();
    const consumer = {
      apply: vi.fn(() => ({ forRoutes })),
    } as any;

    const appModule = new AppModule();
    appModule.configure(consumer);

    expect(consumer.apply).toHaveBeenCalledTimes(2);
    expect(forRoutes).toHaveBeenCalledTimes(2);
  });
});
