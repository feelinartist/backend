import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service';
import prisma from '../../infrastructure/database/prisma';

describe('PrismaService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disconnects the Prisma client on module destroy', async () => {
    const disconnectSpy = vi.spyOn(prisma, '$disconnect').mockResolvedValue(undefined as any);
    const service = new PrismaService();

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});
