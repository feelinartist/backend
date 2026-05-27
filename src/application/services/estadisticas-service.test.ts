import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EstadisticasService } from './estadisticas-service';
import prisma from '../../infrastructure/database/prisma';

describe('EstadisticasService', () => {
    let service: EstadisticasService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new EstadisticasService();
    });

    it('should retrieve statistics for an event successfully', async () => {
        // Mock event lookup
        vi.mocked(prisma.evento.findUnique).mockResolvedValue({
            id: 'event-123',
            titulo: 'Test Concert',
            perfilArtistaId: 'artist-456'
        } as any);

        // Mock event song requests with multiple accepted and rejected songs
        vi.mocked(prisma.pedidoCancion.findMany).mockResolvedValue([
            { titulo: 'Song A', artista: 'Artist X', estado: 'ACEPTADO', genero: 'Rock', itunesId: 'itunes-1' },
            { titulo: 'Song A', artista: 'Artist X', estado: 'ACEPTADO', genero: 'Rock', itunesId: 'itunes-1' },
            { titulo: 'Song B', artista: 'Artist Y', estado: 'ACEPTADO', genero: 'Pop', itunesId: 'itunes-2' },
            { titulo: 'Song B', artista: 'Artist Y', estado: 'RECHAZADO', genero: 'Pop', itunesId: 'itunes-2' },
            { titulo: 'Song C', artista: 'Artist Z', estado: 'RECHAZADO', genero: 'Pop', itunesId: 'itunes-3' },
            { titulo: 'Song C', artista: 'Artist Z', estado: 'RECHAZADO', genero: 'Pop', itunesId: 'itunes-3' },
            { titulo: 'Song C', artista: 'Artist Z', estado: 'RECHAZADO', genero: 'Pop', itunesId: 'itunes-3' },
            { titulo: 'Song D', artista: 'Artist W', estado: 'PENDIENTE', genero: 'Jazz', itunesId: 'itunes-4' },
        ] as any);

        const stats = await service.obtenerEstadisticasEvento('event-123');

        expect(stats.totalPedidos).toBe(8);
        expect(stats.totalAceptados).toBe(3);
        expect(stats.totalRechazados).toBe(4);
        expect(stats.totalPendientes).toBe(1);
        expect(stats.tasaAceptacion).toBe(38);
        expect(stats.generosPorConteo).toEqual([
            { genero: 'Pop', conteo: 5, porcentaje: 63 },
            { genero: 'Rock', conteo: 2, porcentaje: 25 },
            { genero: 'Jazz', conteo: 1, porcentaje: 13 }
        ]);
        expect(stats.topCanciones[0].titulo).toBe('Song C');
        expect(stats.topAceptadas[0].titulo).toBe('Song A');
        expect(stats.topRechazadas[0].titulo).toBe('Song C');
    });

    it('should throw an error if the event is not found', async () => {
        vi.mocked(prisma.evento.findUnique).mockResolvedValue(null);
        await expect(service.obtenerEstadisticasEvento('event-unknown')).rejects.toThrow('Evento no encontrado');
    });

    it('should retrieve statistics for an artist successfully', async () => {
        // Mock finished events lookup
        vi.mocked(prisma.evento.findMany).mockResolvedValue([
            { id: 'event-1', titulo: 'Concert A', horaInicio: new Date('2026-05-26T20:00:00Z') },
            { id: 'event-2', titulo: 'Concert B', horaInicio: new Date('2026-05-27T20:00:00Z') },
        ] as any);

        // Mock groupBys for totals, songs, and active events
        vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValueOnce([
            { estado: 'ACEPTADO', _count: { id: 10 } },
            { estado: 'RECHAZADO', _count: { id: 5 } },
            { estado: 'PENDIENTE', _count: { id: 2 } },
        ] as any);

        vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValueOnce([
            { titulo: 'Song A', artista: 'Artist X', genero: 'Rock', estado: 'ACEPTADO', _count: { id: 8 }, _max: { creadoEn: new Date() } },
            { titulo: 'Song A', artista: 'Artist X', genero: 'Rock', estado: 'RECHAZADO', _count: { id: 2 }, _max: { creadoEn: new Date() } },
            { titulo: 'Song B', artista: 'Artist Y', genero: 'Pop', estado: 'ACEPTADO', _count: { id: 2 }, _max: { creadoEn: new Date() } },
            { titulo: 'Song B', artista: 'Artist Y', genero: 'Pop', estado: 'RECHAZADO', _count: { id: 3 }, _max: { creadoEn: new Date() } },
        ] as any);

        vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValueOnce([
            { eventoId: 'event-1', _count: { id: 12 } },
            { eventoId: 'event-2', _count: { id: 5 } }
        ] as any);

        const stats = await service.obtenerEstadisticasArtista('artist-123');

        expect(stats.totalEventos).toBe(2);
        expect(stats.totalPedidos).toBe(17);
        expect(stats.totalAceptados).toBe(10);
        expect(stats.totalRechazados).toBe(5);
        expect(stats.tasaAceptacion).toBe(67);
        expect(stats.topCanciones[0].titulo).toBe('Song A');
        expect(stats.topCanciones[0].conteo).toBe(10);
        expect(stats.topCanciones[1].titulo).toBe('Song B');
        expect(stats.topCanciones[1].conteo).toBe(5);
        expect(stats.generosPorConteo[0].genero).toBe('Rock');
        expect(stats.generosPorConteo[1].genero).toBe('Pop');
        expect(stats.eventosMasActivos.length).toBe(2);
        expect(stats.eventosMasActivos[0]).toEqual({
            eventoId: 'event-1',
            titulo: 'Concert A',
            totalPedidos: 12,
            fecha: '2026-05-26T20:00:00.000Z'
        });
    });

    it('should return empty statistics if artist has no events', async () => {
        vi.mocked(prisma.evento.findMany).mockResolvedValue([]);
        const stats = await service.obtenerEstadisticasArtista('artist-empty');
        expect(stats.totalEventos).toBe(0);
        expect(stats.totalPedidos).toBe(0);
    });

    it('should get detail of song requests for artist with pagination and sorting', async () => {
        vi.mocked(prisma.evento.findMany).mockResolvedValue([
            { id: 'event-1' }
        ] as any);

        vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValue([
            { titulo: 'Song A', artista: 'Artist X', genero: 'Rock', estado: 'ACEPTADO', _count: { id: 5 }, _max: { creadoEn: new Date('2026-05-26T21:00:00Z') } },
            { titulo: 'Song B', artista: 'Artist Y', genero: 'Pop', estado: 'RECHAZADO', _count: { id: 2 }, _max: { creadoEn: new Date('2026-05-26T22:00:00Z') } }
        ] as any);

        const result = await service.obtenerDetalleCancionesArtista('artist-123', 1, 2, 'Song', 'pedidas');

        expect(result.total).toBe(2);
        expect(result.canciones.length).toBe(2);
        expect(result.canciones[0].titulo).toBe('Song A');
        expect(result.canciones[0].total).toBe(5);
    });

    it('should get detail of song requests for event with pagination and sorting', async () => {
        vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValue([
            { titulo: 'Song A', artista: 'Artist X', genero: 'Rock', estado: 'ACEPTADO', _count: { id: 5 }, _max: { creadoEn: new Date('2026-05-26T21:00:00Z') } },
            { titulo: 'Song B', artista: 'Artist Y', genero: 'Pop', estado: 'RECHAZADO', _count: { id: 2 }, _max: { creadoEn: new Date('2026-05-26T22:00:00Z') } }
        ] as any);

        const result = await service.obtenerDetalleCancionesEvento('event-123', 1, 2, '', 'recientes');

        expect(result.total).toBe(2);
        expect(result.canciones[0].titulo).toBe('Song B'); // Song B has later creadoEn
    });

    it('should return empty list when artist has no events in obtenerDetalleCancionesArtista', async () => {
        vi.mocked(prisma.evento.findMany).mockResolvedValue([]);
        const result = await service.obtenerDetalleCancionesArtista('artist-no-events', 1, 20);
        expect(result.canciones).toEqual([]);
        expect(result.total).toBe(0);
    });

    it('should search by artist name and match correctly', async () => {
        vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValue([
            { titulo: 'Song A', artista: 'UniqueArtistX', genero: 'Rock', estado: 'ACEPTADO', _count: { id: 5 }, _max: { creadoEn: new Date() } },
            { titulo: 'Song B', artista: 'OtherArtistY', genero: 'Pop', estado: 'RECHAZADO', _count: { id: 2 }, _max: { creadoEn: new Date() } }
        ] as any);

        const result = await service.obtenerDetalleCancionesEvento('event-123', 1, 2, 'UniqueArtistX', 'pedidas');
        expect(result.total).toBe(1);
        expect(result.canciones[0].artista).toBe('UniqueArtistX');
    });

    it('should sort by aceptadas and rechazadas', async () => {
        vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValue([
            { titulo: 'Song A', artista: 'Artist X', genero: 'Rock', estado: 'ACEPTADO', _count: { id: 5 }, _max: { creadoEn: new Date() } },
            { titulo: 'Song B', artista: 'Artist Y', genero: 'Pop', estado: 'RECHAZADO', _count: { id: 10 }, _max: { creadoEn: new Date() } }
        ] as any);

        // Sort by aceptadas: Song A has 5 accepted, Song B has 0 accepted (only rejected)
        const sortAceptadas = await service.obtenerDetalleCancionesEvento('event-123', 1, 2, '', 'aceptadas');
        expect(sortAceptadas.canciones[0].titulo).toBe('Song A');

        // Sort by rechazadas: Song B has 10 rejected, Song A has 0 rejected
        const sortRechazadas = await service.obtenerDetalleCancionesEvento('event-123', 1, 2, '', 'rechazadas');
        expect(sortRechazadas.canciones[0].titulo).toBe('Song B');
    });
});
