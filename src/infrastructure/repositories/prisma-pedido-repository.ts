import { PrismaClient, EstadoPedidoCancion } from "@prisma/client";
import { redisService } from "../services/redis-service";

const prisma = new PrismaClient();

export class PrismaPedidoRepository {
    async crearPedido(
        eventoId: string,
        titulo: string,
        artista?: string,
        usuarioId?: string,
        itunesId?: string,
        nombreSolicitante?: string,
        genero?: string,
        imagenUrl?: string,
        previewUrl?: string
    ) {
        // Obtener perfilArtistaId del evento
        const evento = await prisma.evento.findUnique({
            where: { id: eventoId },
            select: { perfilArtistaId: true }
        });

        if (!evento) throw new Error("Evento no encontrado");

        const pedido = await prisma.pedidoCancion.create({
            data: {
                eventoId,
                titulo,
                artista,
                usuarioId,
                itunesId,
                nombreSolicitante,
                genero,
                estado: "PENDIENTE",
                perfilArtistaId: evento.perfilArtistaId
            }
        });

        // 🛡️ Redis: Contadores y Ranking de Popularidad en Tiempo Real
        try {
            await redisService.incr(`event:${eventoId}:orders:total`);
            await redisService.incr('stats:orders:total');

            // Identificador único para la canción (iTunes ID o combinación de nombre)
            const songData = JSON.stringify({
                titulo,
                artista,
                itunesId,
                genero,
                imagenUrl,
                previewUrl
            });

            // 🚀 INCREMENTAR VOTOS: En Redis, el Sorted Set 'ranking' guardará la canción
            await redisService.zincrby(`event:${eventoId}:popularity_ranking`, 1, songData);

            // Cola cronológica
            const liveOrderData = JSON.stringify({
                id: pedido.id,
                titulo: pedido.titulo,
                artista: pedido.artista,
                nombreSolicitante: pedido.nombreSolicitante,
                itunesId: pedido.itunesId,
                creadoEn: pedido.creadoEn,
                imagenUrl,
                previewUrl
            });
            await redisService.zadd(`event:${eventoId}:live_queue`, Date.now(), liveOrderData);

            // 🏷️ Shadow Key for Cleanup: Store the exact payload used in ZADD
            // This allows us to perform a clean ZREM later without guessing the string
            await redisService.set(`request:payload:${pedido.id}`, liveOrderData, 86400); // 24h TTL

        } catch (err) {
            console.warn('Error updating popularity ranking in Redis:', err);
        }

        // 5. Async Stats: We don't write to MySQL EstadisticasCancion here anymore.
        // We rely on 'actualizarEstado' to increment counters in Redis buffer.
        // The song is already in Redis 'popularity_ranking' (ZSET) for immediate top lists.

        return pedido;
    }

    async obtenerPedidosPorEvento(eventoId: string) {
        // 1. Intentar obtener el Ranking de Popularidad de Redis
        try {
            const ranking = await redisService.zrevrangeWithScores(`event:${eventoId}:popularity_ranking`, 0, 49);
            if (ranking.length > 0) {
                return ranking.map(item => {
                    const data = JSON.parse(item.member);
                    return {
                        ...data,
                        votos: item.score,
                        esRanking: true
                    };
                });
            }
        } catch (err) {
            console.warn('Error fetching popularity ranking from Redis, falling back to live queue:', err);
        }

        // 2. Intentar obtener de la "Cola Viva" cronológica (Fallback 1)
        try {
            const liveQueue = await redisService.zrevrange(`event:${eventoId}:live_queue`, 0, 99);
            if (liveQueue.length > 0) {
                return liveQueue.map((item: string) => JSON.parse(item));
            }
        } catch (err) {
            console.warn('Error fetching live queue from Redis, falling back to DB:', err);
        }

        // 3. Fallback a DB (Prisma)
        return await prisma.pedidoCancion.findMany({
            where: {
                eventoId,
                estado: 'PENDIENTE'
            },
            take: 100,
            orderBy: { creadoEn: 'desc' }
        });
    }

    async actualizarEstado(id: string, estado: EstadoPedidoCancion) {
        // Obtener pedido anterior para comparar estados
        const pedidoAnterior = await prisma.pedidoCancion.findUnique({
            where: { id },
            select: {
                estado: true,
                itunesId: true,
                titulo: true,
                artista: true,
                perfilArtistaId: true,
                eventoId: true,
                nombreSolicitante: true,
                creadoEn: true,
                genero: true
            }
        });

        if (!pedidoAnterior) throw new Error("Pedido no encontrado");
        if (pedidoAnterior.estado === estado) return pedidoAnterior;

        const pedido = await prisma.pedidoCancion.update({
            where: { id },
            data: { estado }
        });

        // 🛡️ Redis: Limpieza de la Cola Viva y actualización de contadores
        if (pedidoAnterior.perfilArtistaId && pedidoAnterior.eventoId) {
            try {
                // Si ya no es PENDIENTE, lo quitamos de la cola viva y del ranking de Redis
                if (estado !== 'PENDIENTE') {
                    // 1. Quitar de la cola cronológica usando Shadow Key
                    const shadowKey = `request:payload:${id}`;
                    const payload = await redisService.get(shadowKey);

                    if (payload) {
                        await redisService.zrem(`event:${pedidoAnterior.eventoId}:live_queue`, payload);
                        await redisService.del(shadowKey); // Cleanup shadow key
                    } else {
                        // Fallback: If payload lost (TTL), we might have a ghost in the queue.
                        // The frontend usually filters by ID, but ZREM is cleaner.
                        console.warn(`[Redis] Shadow key missing for cleanup: ${shadowKey}`);
                    }

                    // 2. Quitar del ranking de popularidad?
                    // No, usually we want to keep it in the "Most Voted" list even if processed?
                    // User requirement: "aceptar, rechazar". Usually "Accepted" songs might stay in "Now Playing" or similar.
                    // "Rejected" definitely go away.
                    // For now, let's leave Ranking as is (it's "Popularity", not "Pending List").
                }

                // (Old synchronous Redis counters removed in favor of Async Stats below)
            } catch (error) {
                console.warn("Error cleaning up Redis queue:", error);
            }
        }

        // 🛡️ REFACTOR: Write-Behind Pattern using Redis Buffer
        // Instead of writing to MySQL immediately, we increment counters in Redis.
        // The Worker (stats-sync-service) will persist this later.

        if (pedidoAnterior.titulo && pedidoAnterior.artista && pedidoAnterior.perfilArtistaId) {
            try {
                // Use a stable ID (iTunes ID or generated one)
                const itunesKey = pedidoAnterior.itunesId || `manual_${pedidoAnterior.titulo}_${pedidoAnterior.artista}`;
                const bufferKey = `stats:buffer:${itunesKey}`;

                // Metadata to allow the worker to create the record if missing
                // Use HSETNX to set these only if they don't exist (save bandwidth/ops)
                await redisService.hsetnx(bufferKey, 'perfilArtistaId', pedidoAnterior.perfilArtistaId);
                await redisService.hsetnx(bufferKey, 'titulo', pedidoAnterior.titulo);
                await redisService.hsetnx(bufferKey, 'artista', pedidoAnterior.artista);
                if (pedidoAnterior.genero) await redisService.hsetnx(bufferKey, 'genero', pedidoAnterior.genero);

                const estadoNuevo = estado;
                const estadoAnterior = pedidoAnterior.estado;

                // Decrement old status (if applicable) -> To keep stats accurate if I switch Accept->Reject
                // Note: The worker handles negatives? Yes.
                if (estadoAnterior === 'ACEPTADO') {
                    await redisService.hincrby(bufferKey, 'accepted', -1);
                } else if (estadoAnterior === 'RECHAZADO') {
                    await redisService.hincrby(bufferKey, 'rejected', -1);
                }

                // Increment new status
                if (estadoNuevo === 'ACEPTADO') {
                    await redisService.hincrby(bufferKey, 'accepted', 1);
                } else if (estadoNuevo === 'RECHAZADO') {
                    await redisService.hincrby(bufferKey, 'rejected', 1);
                }

            } catch (error) {
                console.error("Error buffering stats to Redis:", error);
                // Fallback: If Redis fails, we COULD try direct DB write, but let's keep it simple for now.
                // Critical failure in Redis means stats might lag, but order processing continues.
            }
        }

        return pedido;
    }
}
