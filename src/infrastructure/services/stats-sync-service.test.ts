import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatsSyncService } from './stats-sync-service';
import { redisService } from './redis-service';
import prisma from '../database/prisma';

vi.mock('./redis-service', () => {
    return {
        redisService: {
            scan: vi.fn(),
            hget: vi.fn(),
            hincrby: vi.fn(),
            del: vi.fn(),
        }
    };
});

describe('StatsSyncService', () => {
    let service: StatsSyncService;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        service = new StatsSyncService();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start and stop correctly', () => {
        service.start();
        expect((service as any).syncInterval).toBeDefined();
        
        // Calling start again should return early
        const currentInterval = (service as any).syncInterval;
        service.start();
        expect((service as any).syncInterval).toBe(currentInterval);

        service.stop();
        expect((service as any).syncInterval).toBeNull();
        
        // Calling stop again when stopped should do nothing
        service.stop();
        expect((service as any).syncInterval).toBeNull();
    });

    it('should trigger syncToDatabase on interval', async () => {
        const syncSpy = vi.spyOn(service, 'syncToDatabase').mockResolvedValue(undefined);
        service.start();

        await vi.advanceTimersByTimeAsync(60000);
        expect(syncSpy).toHaveBeenCalled();
        
        service.stop();
    });

    it('should handle interval error catch', async () => {
        const syncSpy = vi.spyOn(service, 'syncToDatabase').mockRejectedValue(new Error('Sync interval error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        service.start();

        await vi.advanceTimersByTimeAsync(60000);
        expect(syncSpy).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('[StatsSync] Sync error:', expect.any(Error));
        
        service.stop();
        consoleSpy.mockRestore();
    });

    it('should sync buffered stats from Redis to Database successfully', async () => {
        // Mock redisService.scan to return one batch and then terminate (cursor '0')
        vi.mocked(redisService.scan).mockResolvedValueOnce(['123', ['stats:buffer:song123']]);
        vi.mocked(redisService.scan).mockResolvedValueOnce(['0', []]);

        // Mock hash getters
        vi.mocked(redisService.hget).mockImplementation(async (key, field) => {
            if (field === 'accepted') return '5';
            if (field === 'rejected') return '2';
            if (field === 'perfilArtistaId') return 'artist456';
            if (field === 'titulo') return 'Test Song';
            if (field === 'artista') return 'Test Artist';
            if (field === 'genero') return 'Pop';
            return null;
        });

        // Mock prisma upsert
        vi.mocked(prisma.estadisticasCancion.upsert).mockResolvedValue({} as any);

        await service.syncToDatabase();

        expect(redisService.scan).toHaveBeenCalled();
        expect(prisma.estadisticasCancion.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                create: expect.objectContaining({
                    itunesId: 'song123',
                    totalAceptados: 5,
                    totalRechazados: 2,
                })
            })
        );
        expect(redisService.hincrby).toHaveBeenCalledWith('stats:buffer:song123', 'accepted', -5);
        expect(redisService.hincrby).toHaveBeenCalledWith('stats:buffer:song123', 'rejected', -2);
    });

    it('should clean up key if accepted and rejected counts are zero', async () => {
        vi.mocked(redisService.scan).mockResolvedValueOnce(['0', ['stats:buffer:song456']]);
        vi.mocked(redisService.hget).mockImplementation(async (key, field) => {
            if (field === 'accepted') return '0';
            if (field === 'rejected') return '0';
            return null;
        });

        await service.syncToDatabase();

        expect(redisService.del).toHaveBeenCalledWith('stats:buffer:song456');
        expect(prisma.estadisticasCancion.upsert).not.toHaveBeenCalled();
    });

    it('should skip key if required metadata is missing', async () => {
        vi.mocked(redisService.scan).mockResolvedValueOnce(['0', ['stats:buffer:song789']]);
        // Missing perfilArtistaId
        vi.mocked(redisService.hget).mockImplementation(async (key, field) => {
            if (field === 'accepted') return '1';
            if (field === 'rejected') return '1';
            if (field === 'titulo') return 'Test Title';
            if (field === 'artista') return 'Test Artist';
            return null;
        });

        await service.syncToDatabase();

        expect(prisma.estadisticasCancion.upsert).not.toHaveBeenCalled();
    });

    it('should handle errors in scan gracefully', async () => {
        vi.mocked(redisService.scan).mockRejectedValue(new Error('Scan failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await service.syncToDatabase();

        expect(consoleSpy).toHaveBeenCalledWith('[StatsSync] Error during sync:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should handle errors in processing a single key gracefully', async () => {
        vi.mocked(redisService.scan).mockResolvedValueOnce(['0', ['stats:buffer:songErr']]);
        vi.mocked(redisService.hget).mockImplementation(async (key, field) => {
            if (field === 'accepted') return '3';
            if (field === 'rejected') return '1';
            if (field === 'perfilArtistaId') return 'artistErr';
            if (field === 'titulo') return 'Error Song';
            if (field === 'artista') return 'Error Artist';
            return null;
        });
        vi.mocked(prisma.estadisticasCancion.upsert).mockRejectedValue(new Error('DB Upsert failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await service.syncToDatabase();

        expect(consoleSpy).toHaveBeenCalledWith('[StatsSync] Failed to sync key stats:buffer:songErr:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should handle scan with zero keys returned', async () => {
        vi.mocked(redisService.scan).mockResolvedValueOnce(['0', []]);
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await service.syncToDatabase();

        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockRestore();
    });

    it('should handle missing accepted/rejected values and increment only positive counts', async () => {
        vi.mocked(redisService.scan).mockResolvedValueOnce(['0', ['stats:buffer:songMix']]);
        vi.mocked(redisService.hget).mockImplementation(async (key, field) => {
            if (field === 'accepted') return null; // defaults to 0
            if (field === 'rejected') return '3';
            if (field === 'perfilArtistaId') return 'artistMix';
            if (field === 'titulo') return 'Mix Song';
            if (field === 'artista') return 'Mix Artist';
            return null;
        });

        vi.mocked(prisma.estadisticasCancion.upsert).mockResolvedValue({} as any);

        await service.syncToDatabase();

        expect(prisma.estadisticasCancion.upsert).toHaveBeenCalled();
        expect(redisService.hincrby).not.toHaveBeenCalledWith(expect.any(String), 'accepted', expect.any(Number));
        expect(redisService.hincrby).toHaveBeenCalledWith('stats:buffer:songMix', 'rejected', -3);
    });

    it('should handle other missing values combinations like only accepted positive', async () => {
        vi.mocked(redisService.scan).mockResolvedValueOnce(['0', ['stats:buffer:songOnlyAcc']]);
        vi.mocked(redisService.hget).mockImplementation(async (key, field) => {
            if (field === 'accepted') return '4';
            if (field === 'rejected') return null; // defaults to 0
            if (field === 'perfilArtistaId') return 'artistOnlyAcc';
            if (field === 'titulo') return 'OnlyAcc Song';
            if (field === 'artista') return 'OnlyAcc Artist';
            return null;
        });

        vi.mocked(prisma.estadisticasCancion.upsert).mockResolvedValue({} as any);

        await service.syncToDatabase();

        expect(prisma.estadisticasCancion.upsert).toHaveBeenCalled();
        expect(redisService.hincrby).toHaveBeenCalledWith('stats:buffer:songOnlyAcc', 'accepted', -4);
        expect(redisService.hincrby).not.toHaveBeenCalledWith(expect.any(String), 'rejected', expect.any(Number));
    });
});
