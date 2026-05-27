import prisma from '../database/prisma';
import { redisService } from './redis-service';

export class StatsSyncService {
    private syncInterval: NodeJS.Timeout | null = null;
    private readonly SYNC_INTERVAL_MS = 60000; // 60 seconds
    private readonly BATCH_SIZE = 100;

    start() {
        if (this.syncInterval) return;

        console.log('[StatsSync] Service started (Interval: 60s)');
        this.syncInterval = setInterval(() => {
            this.syncToDatabase().catch(err => {
                console.error('[StatsSync] Sync error:', err);
            });
        }, this.SYNC_INTERVAL_MS);
    }

    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('[StatsSync] Service stopped');
        }
    }

    /**
     * Reads buffered stats from Redis and performs bulk upsert to MySQL
     */
    async syncToDatabase() {
        const pattern = 'stats:buffer:*';
        let cursor = '0';
        let processedCount = 0;

        try {
            do {
                // Scan keys to avoid blocking Redis
                const reply = await redisService.scan(cursor, 'MATCH', pattern, 'COUNT', String(this.BATCH_SIZE));
                cursor = reply[0];
                const keys = reply[1];

                if (keys.length > 0) {
                    await this.processBatch(keys);
                    processedCount += keys.length;
                }

            } while (cursor !== '0');

            if (processedCount > 0) {
                console.log(`[StatsSync] Synced ${processedCount} songs stats to Database.`);
            }
        } catch (error) {
            console.error('[StatsSync] Error during sync:', error);
        }
    }

    private async processBatch(keys: string[]) {
        for (const key of keys) {
            try {
                // Extract itunesId from key "stats:buffer:{itunesId}"
                const itunesId = key.replace('stats:buffer:', '');

                // Get pending increments
                const acceptedStr = await redisService.hget(key, 'accepted');
                const rejectedStr = await redisService.hget(key, 'rejected');
                const perfilArtistaId = await redisService.hget(key, 'perfilArtistaId');
                const titulo = await redisService.hget(key, 'titulo');
                const artista = await redisService.hget(key, 'artista');
                const genero = await redisService.hget(key, 'genero');

                const accepted = parseInt(acceptedStr || '0', 10);
                const rejected = parseInt(rejectedStr || '0', 10);

                if (accepted === 0 && rejected === 0) {
                    // Nothing new, maybe just clean up?
                    await redisService.del(key);
                    continue;
                }

                if (!perfilArtistaId || !titulo || !artista) {
                    // Data integrity issue or partial data, skip but log
                    // console.warn(`[StatsSync] Missing metadata for key ${key}`);
                    // Wait for next sync or delete? Let's keep it until metadata arrives or TTL expires.
                    continue;
                }

                // Perform Atomic Update in MySQL
                // Use upsert to ensure record exists
                await prisma.estadisticasCancion.upsert({
                    where: {
                        itunesId_perfilArtistaId: {
                            itunesId,
                            perfilArtistaId
                        }
                    },
                    create: {
                        itunesId,
                        perfilArtistaId,
                        titulo,
                        artista,
                        genero: genero || undefined,
                        totalAceptados: accepted,
                        totalRechazados: rejected
                    },
                    update: {
                        totalAceptados: { increment: accepted },
                        totalRechazados: { increment: rejected },
                        // Update metadata if changed (optional)
                        ...(genero && { genero })
                    }
                });

                // Clear buffer for this key AFTER successful DB update
                // To be safe against race conditions (new writes determining the sync), 
                // we technically should DECREMENT what we just persisted, 
                // but since this is a simple sync, deleting the key is risky if new writes happened in ms.
                // Better approach: Decrement by the amount we read.

                if (accepted > 0) await redisService.hincrby(key, 'accepted', -accepted);
                if (rejected > 0) await redisService.hincrby(key, 'rejected', -rejected);

                // Cleanup: If both are 0 (or negative due to some weirdness, though unlikely), delete key
                // But we need to check if they are effectively 0 now.
                // Ideally, we can set an expire on the key so it cleans itself up if empty?
                // Or just leave it?
                // Let's rely on the next scan to delete if 0.
            } catch (err) {
                console.error(`[StatsSync] Failed to sync key ${key}:`, err);
            }
        }
    }
}

export const statsSyncService = new StatsSyncService();
