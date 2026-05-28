import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockApp = {
  setGlobalPrefix: vi.fn(),
  use: vi.fn(),
  enableCors: vi.fn(),
  useStaticAssets: vi.fn(),
  listen: vi.fn(() => Promise.resolve()),
} as const;

vi.mock('@nestjs/core', () => ({
  NestFactory: {
    create: vi.fn(async () => mockApp),
  },
}));

describe('main bootstrap', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      FRONTEND_URL: 'http://localhost:4000',
      PORT: '4002',
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it('bootstraps the Nest application without starting a real server', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await import('./main');

    await new Promise<void>((resolve) => setImmediate(() => resolve()));

    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.useStaticAssets).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith('4002');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('uses default frontend URL and port when env vars are missing', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    process.env = {
      ...originalEnv,
    };
    delete process.env.FRONTEND_URL;
    delete process.env.PORT;

    await import('./main');
    await new Promise<void>((resolve) => setImmediate(() => resolve()));

    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(mockApp.enableCors).toHaveBeenCalledWith(
      expect.objectContaining({ origin: 'http://localhost:3000' }),
    );
    expect(mockApp.listen).toHaveBeenCalledWith(3001);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('calls process.exit when bootstrap throws an error', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const { NestFactory } = await import('@nestjs/core');
    vi.mocked(NestFactory.create).mockRejectedValue(new Error('startup failure'));

    await import('./main');
    await new Promise<void>((resolve) => setImmediate(() => resolve()));

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

