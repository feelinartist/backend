import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export interface EstadisticasEvento {
    eventoId: string;
    eventoTitulo: string;
    totalPedidos: number;
    totalAceptados: number;
    totalRechazados: number;
    totalPendientes: number;
    tasaAceptacion: number;
    generosPorConteo: Array<{
        genero: string;
        conteo: number;
        porcentaje: number;
    }>;
    topCanciones: Array<{
        titulo: string;
        artista: string;
        conteo: number;
        aceptados: number;
        rechazados: number;
    }>;
    topAceptadas: Array<{
        titulo: string;
        artista: string;
        total: number;
    }>;
    topRechazadas: Array<{
        titulo: string;
        artista: string;
        total: number;
    }>;
}

export interface EstadisticasArtista {
    perfilArtistaId: string;
    totalEventos: number;
    totalPedidos: number;
    totalAceptados: number;
    totalRechazados: number;
    totalPendientes: number;
    tasaAceptacion: number;
    generosPorConteo: Array<{
        genero: string;
        conteo: number;
        porcentaje: number;
    }>;
    topCanciones: Array<{
        titulo: string;
        artista: string;
        conteo: number;
        aceptados: number;
        rechazados: number;
        genero?: string;
    }>;
    topAceptadas: Array<{
        titulo: string;
        artista: string;
        total: number;
    }>;
    topRechazadas: Array<{
        titulo: string;
        artista: string;
        total: number;
    }>;
    eventosMasActivos: Array<{
        eventoId: string;
        titulo: string;
        totalPedidos: number;
        fecha: string;
    }>;
}

export class EstadisticasService {
    /**
     * Obtiene estadísticas de un evento específico
     */
    async obtenerEstadisticasEvento(eventoId: string): Promise<EstadisticasEvento> {
        // Obtener evento con perfilArtistaId
        const evento = await prisma.evento.findUnique({
            where: { id: eventoId },
            select: { titulo: true, perfilArtistaId: true }
        });

        if (!evento) {
            throw new Error("Evento no encontrado");
        }

        // Obtener pedidos del evento (solo para contar pendientes y géneros sin estadísticas)
        const pedidos = await prisma.pedidoCancion.findMany({
            where: { eventoId },
            select: {
                titulo: true,
                artista: true,
                estado: true,
                genero: true,
                itunesId: true
            }
        });

        // Obtener estadísticas desde la tabla de contadores (RÁPIDO)
        // Obtener estadísticas desde la tabla de contadores (RÁPIDO) - Code removed as unused

        // Calcular totales
        const totalPedidos = pedidos.length;
        const totalAceptados = pedidos.filter(p => p.estado === 'ACEPTADO').length;
        const totalRechazados = pedidos.filter(p => p.estado === 'RECHAZADO').length;
        const totalPendientes = pedidos.filter(p => p.estado === 'PENDIENTE').length;
        const tasaAceptacion = totalPedidos > 0 ? Math.round((totalAceptados / totalPedidos) * 100) : 0;

        // Contar géneros desde pedidos (incluye pendientes)
        const generoConteo = new Map<string, number>();
        pedidos.forEach(pedido => {
            if (pedido.genero) {
                const generos = pedido.genero.split(', ');
                generos.forEach(genero => {
                    const normalizado = genero.trim();
                    generoConteo.set(normalizado, (generoConteo.get(normalizado) || 0) + 1);
                });
            }
        });

        const generosPorConteo = Array.from(generoConteo.entries())
            .map(([genero, conteo]) => ({
                genero,
                conteo,
                porcentaje: totalPedidos > 0 ? Math.round((conteo / totalPedidos) * 100) : 0
            }))
            .sort((a, b) => b.conteo - a.conteo)
            .slice(0, 5);

        // Top canciones (contar por pedido en este evento)
        const cancionConteo = new Map<string, { titulo: string; artista: string; aceptados: number; rechazados: number; total: number }>();
        pedidos.forEach(pedido => {
            const key = `${pedido.titulo}||| ${pedido.artista} `;
            if (!cancionConteo.has(key)) {
                cancionConteo.set(key, {
                    titulo: pedido.titulo || 'Sin título',
                    artista: pedido.artista || 'Desconocido',
                    aceptados: 0,
                    rechazados: 0,
                    total: 0
                });
            }
            const stats = cancionConteo.get(key)!;
            stats.total++;
            if (pedido.estado === 'ACEPTADO') stats.aceptados++;
            if (pedido.estado === 'RECHAZADO') stats.rechazados++;
        });

        const topCanciones = Array.from(cancionConteo.values())
            .map(stats => ({
                titulo: stats.titulo,
                artista: stats.artista,
                conteo: stats.total,
                aceptados: stats.aceptados,
                rechazados: stats.rechazados
            }))
            .sort((a, b) => b.conteo - a.conteo)
            .slice(0, 20);

        // Top canciones más aceptadas
        const topAceptadas = Array.from(cancionConteo.values())
            .filter(stats => stats.aceptados > 0)
            .map(stats => ({
                titulo: stats.titulo,
                artista: stats.artista,
                total: stats.aceptados
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        // Top canciones más rechazadas
        const topRechazadas = Array.from(cancionConteo.values())
            .filter(stats => stats.rechazados > 0)
            .map(stats => ({
                titulo: stats.titulo,
                artista: stats.artista,
                total: stats.rechazados
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return {
            eventoId,
            eventoTitulo: evento.titulo,
            totalPedidos,
            totalAceptados,
            totalRechazados,
            totalPendientes,
            tasaAceptacion,
            generosPorConteo,
            topCanciones,
            topAceptadas,
            topRechazadas
        };
    }

    /**
     * Obtiene estadísticas globales de un artista
     */
    async obtenerEstadisticasArtista(perfilArtistaId: string): Promise<EstadisticasArtista> {
        // Obtener todos los eventos del artista TERMINADOS
        const eventosArtist = await prisma.evento.findMany({
            where: { perfilArtistaId, activo: false },
            select: { id: true, titulo: true, horaInicio: true }
        });

        const eventoIds = eventosArtist.map(e => e.id);
        const totalEventos = eventosArtist.length;

        if (totalEventos === 0) {
            return {
                perfilArtistaId,
                totalEventos: 0,
                totalPedidos: 0,
                totalAceptados: 0,
                totalRechazados: 0,
                totalPendientes: 0,
                tasaAceptacion: 0,
                generosPorConteo: [],
                topCanciones: [],
                topAceptadas: [],
                topRechazadas: [],
                eventosMasActivos: []
            };
        }

        // Calcular totales desde Pedidos filtrando por IDs de eventos
        const pedidosStats = await prisma.pedidoCancion.groupBy({
            by: ['estado'],
            where: { eventoId: { in: eventoIds } },
            _count: { id: true }
        });

        const totalAceptados = pedidosStats.find(p => p.estado === 'ACEPTADO')?._count.id || 0;
        const totalRechazados = pedidosStats.find(p => p.estado === 'RECHAZADO')?._count.id || 0;
        const totalPendientes = pedidosStats.find(p => p.estado === 'PENDIENTE')?._count.id || 0;
        const totalPedidos = totalAceptados + totalRechazados + totalPendientes;

        const tasaAceptacion = (totalAceptados + totalRechazados) > 0
            ? Math.round((totalAceptados / (totalAceptados + totalRechazados)) * 100)
            : 0;

        // Agrupar por canción para obtener estadísticas detalladas
        const songStats = await prisma.pedidoCancion.groupBy({
            by: ['titulo', 'artista', 'genero', 'estado'],
            where: { eventoId: { in: eventoIds } },
            _count: { id: true }
        });

        const generoConteo = new Map<string, number>();
        const songMap = new Map<string, { titulo: string; artista: string; total: number; aceptados: number; rechazados: number; genero?: string }>();

        songStats.forEach(stat => {
            const count = stat._count.id;

            // Lógica de géneros (solo aceptados y rechazados para popularidad)
            if (stat.genero && (stat.estado === 'ACEPTADO' || stat.estado === 'RECHAZADO')) {
                const generos = stat.genero.split(',');
                generos.forEach(g => {
                    const norm = g.trim();
                    if (norm) generoConteo.set(norm, (generoConteo.get(norm) || 0) + count);
                });
            }

            // Lógica de canciones
            // Usar título y artista como clave única
            const key = `${stat.titulo}||| ${stat.artista} `;
            if (!songMap.has(key)) {
                songMap.set(key, {
                    titulo: stat.titulo || 'Desconocido',
                    artista: stat.artista || 'Desconocido',
                    total: 0,
                    aceptados: 0,
                    rechazados: 0,
                    genero: stat.genero || undefined
                });
            }
            const s = songMap.get(key)!;
            s.total += count;
            if (stat.estado === 'ACEPTADO') s.aceptados += count;
            if (stat.estado === 'RECHAZADO') s.rechazados += count;
        });

        const generosPorConteo = Array.from(generoConteo.entries())
            .map(([genero, conteo]) => ({
                genero,
                conteo,
                porcentaje: (totalAceptados + totalRechazados) > 0 ? Math.round((conteo / (totalAceptados + totalRechazados)) * 100) : 0
            }))
            .sort((a, b) => b.conteo - a.conteo)
            .slice(0, 10);

        const allSongs = Array.from(songMap.values());

        const topCanciones = [...allSongs]
            .sort((a, b) => b.total - a.total)
            .map(s => ({
                ...s,
                conteo: s.total
            }))
            .slice(0, 20);

        const topAceptadas = [...allSongs].filter(s => s.aceptados > 0).sort((a, b) => b.aceptados - a.aceptados).slice(0, 10);
        const topRechazadas = [...allSongs].filter(s => s.rechazados > 0).sort((a, b) => b.rechazados - a.rechazados).slice(0, 10);

        // Eventos más activos
        const eventosPedidos = await prisma.pedidoCancion.groupBy({
            by: ['eventoId'],
            where: { eventoId: { in: eventoIds } },
            _count: { id: true }
        });

        const eventosMasActivos = eventosPedidos
            .map(ep => {
                const evento = eventosArtist.find(e => e.id === ep.eventoId);
                return evento ? {
                    eventoId: ep.eventoId,
                    titulo: evento.titulo,
                    totalPedidos: ep._count.id,
                    fecha: evento.horaInicio.toISOString()
                } : null;
            })
            .filter((e): e is NonNullable<typeof e> => e !== null)
            .sort((a, b) => b.totalPedidos - a.totalPedidos)
            .slice(0, 10);

        return {
            perfilArtistaId,
            totalEventos,
            totalPedidos,
            totalAceptados,
            totalRechazados,
            totalPendientes,
            tasaAceptacion,
            generosPorConteo,
            topCanciones,
            topAceptadas,
            topRechazadas,
            eventosMasActivos
        };
    }

    /**
     * Obtiene el detalle paginado de canciones de un artista
     */
    async obtenerDetalleCancionesArtista(
        perfilArtistaId: string,
        page: number = 1,
        limit: number = 20,
        search: string = '',
        ordenarPor: 'pedidas' | 'aceptadas' | 'rechazadas' | 'recientes' = 'pedidas'
    ) {
        // 1. Obtener eventos del artista
        const eventosArtist = await prisma.evento.findMany({
            where: { perfilArtistaId, activo: false },
            select: { id: true }
        });

        const eventoIds = eventosArtist.map(e => e.id);

        if (eventoIds.length === 0) {
            return {
                canciones: [],
                total: 0,
                page,
                totalPages: 0
            };
        }

        // 2. Agrupar pedidos por canción
        // Prisma no soporta paginación + groupBy + ordenamiento complejo nativamente de forma sencilla
        const whereClause: Prisma.PedidoCancionWhereInput = {
            eventoId: { in: eventoIds }
        };

        const songStats = await prisma.pedidoCancion.groupBy({
            by: ['titulo', 'artista', 'genero', 'estado'],
            where: whereClause,
            _count: { id: true },
            _max: { creadoEn: true }
        });

        // 3. Procesar y unificar
        const songMap = new Map<string, {
            titulo: string;
            artista: string;
            genero: string;
            total: number;
            aceptados: number;
            rechazados: number;
            ultimoPedido: Date;
        }>();

        songStats.forEach(stat => {
            const key = `${stat.titulo}||| ${stat.artista} `;
            if (!songMap.has(key)) {
                songMap.set(key, {
                    titulo: stat.titulo || 'Desconocido',
                    artista: stat.artista || 'Desconocido',
                    genero: stat.genero || '',
                    total: 0,
                    aceptados: 0,
                    rechazados: 0,
                    ultimoPedido: new Date(0)
                });
            }
            const s = songMap.get(key)!;
            const count = stat._count.id;
            s.total += count;
            if (stat.estado === 'ACEPTADO') s.aceptados += count;
            if (stat.estado === 'RECHAZADO') s.rechazados += count;

            if (stat._max.creadoEn && stat._max.creadoEn > s.ultimoPedido) {
                s.ultimoPedido = stat._max.creadoEn;
            }
        });

        let allSongs = Array.from(songMap.values());

        // 4. Filtrado adicional
        if (search) {
            const searchLower = search.toLowerCase();
            allSongs = allSongs.filter(s =>
                s.titulo?.toLowerCase().includes(searchLower) ||
                s.artista?.toLowerCase().includes(searchLower)
            );
        }

        // 5. Ordenamiento
        allSongs.sort((a, b) => {
            switch (ordenarPor) {
                case 'aceptadas': return b.aceptados - a.aceptados;
                case 'rechazadas': return b.rechazados - a.rechazados;
                case 'recientes': return b.ultimoPedido.getTime() - a.ultimoPedido.getTime();
                case 'pedidas':
                default:
                    return b.total - a.total;
            }
        });

        // 6. Paginación
        const totalItems = allSongs.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const paginatedSongs = allSongs.slice(startIndex, startIndex + limit);

        return {
            canciones: paginatedSongs,
            total: totalItems,
            page,
            totalPages
        };
    }

    /**
     * Obtiene el detalle paginado de canciones de un evento específico
     */
    async obtenerDetalleCancionesEvento(
        eventoId: string,
        page: number = 1,
        limit: number = 20,
        search: string = '',
        ordenarPor: 'pedidas' | 'aceptadas' | 'rechazadas' | 'recientes' = 'pedidas'
    ) {
        const whereClause: Prisma.PedidoCancionWhereInput = {
            eventoId: eventoId
        };

        const songStats = await prisma.pedidoCancion.groupBy({
            by: ['titulo', 'artista', 'genero', 'estado'],
            where: whereClause,
            _count: { id: true },
            _max: { creadoEn: true }
        });

        const songMap = new Map<string, {
            titulo: string;
            artista: string;
            genero: string;
            total: number;
            aceptados: number;
            rechazados: number;
            ultimoPedido: Date;
        }>();

        songStats.forEach(stat => {
            const key = `${stat.titulo}||| ${stat.artista} `;
            if (!songMap.has(key)) {
                songMap.set(key, {
                    titulo: stat.titulo || 'Desconocido',
                    artista: stat.artista || 'Desconocido',
                    genero: stat.genero || '',
                    total: 0,
                    aceptados: 0,
                    rechazados: 0,
                    ultimoPedido: new Date(0)
                });
            }
            const s = songMap.get(key)!;
            const count = stat._count.id;
            s.total += count;
            if (stat.estado === 'ACEPTADO') s.aceptados += count;
            if (stat.estado === 'RECHAZADO') s.rechazados += count;
            if (stat._max.creadoEn && stat._max.creadoEn > s.ultimoPedido) {
                s.ultimoPedido = stat._max.creadoEn;
            }
        });

        let allSongs = Array.from(songMap.values());

        if (search) {
            const searchLower = search.toLowerCase();
            allSongs = allSongs.filter(s =>
                s.titulo?.toLowerCase().includes(searchLower) ||
                s.artista?.toLowerCase().includes(searchLower)
            );
        }

        allSongs.sort((a, b) => {
            switch (ordenarPor) {
                case 'aceptadas': return b.aceptados - a.aceptados;
                case 'rechazadas': return b.rechazados - a.rechazados;
                case 'recientes': return b.ultimoPedido.getTime() - a.ultimoPedido.getTime();
                case 'pedidas':
                default:
                    return b.total - a.total;
            }
        });

        const totalItems = allSongs.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const paginatedSongs = allSongs.slice(startIndex, startIndex + limit);

        return {
            canciones: paginatedSongs,
            total: totalItems,
            page,
            totalPages
        };
    }
}
