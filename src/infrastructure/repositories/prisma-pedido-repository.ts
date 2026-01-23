import { PrismaClient, EstadoPedidoCancion } from "@prisma/client";
import { redisService } from "../services/redis-service";

const prisma = new PrismaClient();

export class PrismaPedidoRepository {
    async crearPedido(
        eventoId: string,
        titulo: string,
        artista?: string,
        usuarioId?: string,
        spotifyId?: string,
        nombreSolicitante?: string,
        genero?: string
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
                spotifyId,
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

            // Identificador único para la canción (Spotify ID o combinación de nombre)
            const songIdentifier = spotifyId || `${titulo.toLowerCase().trim()}:${artista?.toLowerCase().trim()}`;

            // Creamos el objeto de la canción para el Ranking (sin IDs únicos de pedido para permitir agrupación)
            const songData = JSON.stringify({
                titulo,
                artista,
                spotifyId,
                genero // Se actualizará si se encuentra después
            });

            // 🚀 INCREMENTAR VOTOS: En Redis, el Sorted Set 'ranking' guardará la canción
            // y su puntuación será el número de personas que la han pedido.
            await redisService.zincrby(`event:${eventoId}:popularity_ranking`, 1, songData);

            // También mantenemos la cola cronológica para el historial rápido si fuera necesario
            const liveOrderData = JSON.stringify({
                id: pedido.id,
                titulo: pedido.titulo,
                artista: pedido.artista,
                nombreSolicitante: pedido.nombreSolicitante,
                spotifyId: pedido.spotifyId,
                creadoEn: pedido.creadoEn
            });
            await redisService.zadd(`event:${eventoId}:live_queue`, Date.now(), liveOrderData);

        } catch (err) {
            console.warn('Error updating popularity ranking in Redis:', err);
        }

        // 🔍 Intentar obtener género exacto si falta y es de Spotify
        if (spotifyId && !genero) {
            try {
                const { SpotifyService } = await import('../../infrastructure/services/spotify-service');
                const spotify = new SpotifyService();
                const track = await spotify.getTrack(spotifyId);
                const trackData = track as { artists?: Array<{ id: string }> };
                const mainArtist = trackData?.artists?.[0]?.id;

                if (mainArtist) {
                    const genres = await spotify.getArtistGenres(mainArtist);
                    if (genres.length > 0) {
                        const exactGenre = genres[0]; // Tomamos el primer género principal
                        await prisma.pedidoCancion.update({
                            where: { id: pedido.id },
                            data: { genero: exactGenre }
                        });
                        console.log(`[Redis/Spotify] Género exacto encontrado: ${exactGenre}`);
                    }
                }
            } catch (error) {
                console.error("Error buscando género exacto:", error);
            }
        }

        // Actualizar contadores en EstadisticasCancion
        if (titulo && artista) {
            try {
                // Solo crear el registro, los contadores se incrementan al cambiar estado
                await prisma.estadisticasCancion.upsert({
                    where: {
                        spotifyId_perfilArtistaId: {
                            spotifyId: spotifyId || `manual_${titulo}_${artista}`,
                            perfilArtistaId: evento.perfilArtistaId
                        }
                    },
                    create: {
                        spotifyId: spotifyId || `manual_${titulo}_${artista}`,
                        titulo,
                        artista,
                        genero,
                        perfilArtistaId: evento.perfilArtistaId
                    },
                    update: {
                        // Actualizar género si viene de Spotify y no estaba
                        ...(genero && { genero })
                    }
                });
            } catch (error) {
                console.error("Error actualizando estadísticas:", error);
                // No fallamos el pedido si falla la estadística
            }
        }

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
                spotifyId: true,
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
                    // 1. Quitar de la cola cronológica
                    const cronQueueItem = JSON.stringify({
                        id: id,
                        titulo: pedidoAnterior.titulo,
                        artista: pedidoAnterior.artista,
                        nombreSolicitante: pedidoAnterior.nombreSolicitante,
                        spotifyId: pedidoAnterior.spotifyId,
                        creadoEn: pedidoAnterior.creadoEn
                    });
                    await redisService.zrem(`event:${pedidoAnterior.eventoId}:live_queue`, cronQueueItem);

                    // 2. Quitar del ranking de popularidad (agrupado)
                    const popularityItem = JSON.stringify({
                        titulo: pedidoAnterior.titulo,
                        artista: pedidoAnterior.artista,
                        spotifyId: pedidoAnterior.spotifyId,
                        genero: pedidoAnterior.genero
                    });
                    await redisService.zrem(`event:${pedidoAnterior.eventoId}:popularity_ranking`, popularityItem);
                }

                const estadoAnterior = pedidoAnterior.estado;
                const estadoNuevo = estado;

                // Keys para Redis
                const artistStatsKey = `stats:artist:${pedidoAnterior.perfilArtistaId}`;
                const eventStatsKey = `stats:event:${pedidoAnterior.eventoId}`;

                // Decrementar estado anterior en Redis si existía
                if (estadoAnterior === 'ACEPTADO') {
                    await redisService.decr(`${artistStatsKey}:accepted`);
                    await redisService.decr(`${eventStatsKey}:accepted`);
                } else if (estadoAnterior === 'RECHAZADO') {
                    await redisService.decr(`${artistStatsKey}:rejected`);
                    await redisService.decr(`${eventStatsKey}:rejected`);
                }

                // Incrementar nuevo estado en Redis
                if (estadoNuevo === 'ACEPTADO') {
                    await redisService.incr(`${artistStatsKey}:accepted`);
                    await redisService.incr(`${eventStatsKey}:accepted`);
                } else if (estadoNuevo === 'RECHAZADO') {
                    await redisService.incr(`${artistStatsKey}:rejected`);
                    await redisService.incr(`${eventStatsKey}:rejected`);
                }
            } catch (error) {
                console.warn("Error actualizando contadores en Redis:", error);
            }
        }

        // 📊 Actualizar contadores en EstadisticasCancion (Prisma)
        if (pedidoAnterior.titulo && pedidoAnterior.artista && pedidoAnterior.perfilArtistaId) {
            try {
                const estadoAnterior = pedidoAnterior.estado;
                const estadoNuevo = estado;
                const spotifyKey = pedidoAnterior.spotifyId || `manual_${pedidoAnterior.titulo}_${pedidoAnterior.artista}`;

                // Decrementar contador del estado anterior
                if (estadoAnterior === 'ACEPTADO') {
                    await prisma.estadisticasCancion.updateMany({
                        where: {
                            spotifyId: spotifyKey,
                            perfilArtistaId: pedidoAnterior.perfilArtistaId
                        },
                        data: { totalAceptados: { decrement: 1 } }
                    });
                } else if (estadoAnterior === 'RECHAZADO') {
                    await prisma.estadisticasCancion.updateMany({
                        where: {
                            spotifyId: spotifyKey,
                            perfilArtistaId: pedidoAnterior.perfilArtistaId
                        },
                        data: { totalRechazados: { decrement: 1 } }
                    });
                }

                // Incrementar contador del nuevo estado
                if (estadoNuevo === 'ACEPTADO') {
                    await prisma.estadisticasCancion.updateMany({
                        where: {
                            spotifyId: spotifyKey,
                            perfilArtistaId: pedidoAnterior.perfilArtistaId
                        },
                        data: { totalAceptados: { increment: 1 } }
                    });
                } else if (estadoNuevo === 'RECHAZADO') {
                    await prisma.estadisticasCancion.updateMany({
                        where: {
                            spotifyId: spotifyKey,
                            perfilArtistaId: pedidoAnterior.perfilArtistaId
                        },
                        data: { totalRechazados: { increment: 1 } }
                    });
                }
            } catch (error) {
                console.error("Error actualizando contadores de estadísticas en DB:", error);
            }
        }

        return pedido;
    }
}
