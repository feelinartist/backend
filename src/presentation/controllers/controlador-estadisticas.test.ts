import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock the service using variables prefixed with 'mock' to satisfy Vitest's hoisting requirements
const mockObtenerEstadisticasEvento = vi.fn();
const mockObtenerEstadisticasArtista = vi.fn();
const mockObtenerDetalleCancionesArtista = vi.fn();
const mockObtenerDetalleCancionesEvento = vi.fn();

vi.mock('../../application/services/estadisticas-service', () => {
    return {
        EstadisticasService: class MockEstadisticasService {
            obtenerEstadisticasEvento = mockObtenerEstadisticasEvento;
            obtenerEstadisticasArtista = mockObtenerEstadisticasArtista;
            obtenerDetalleCancionesArtista = mockObtenerDetalleCancionesArtista;
            obtenerDetalleCancionesEvento = mockObtenerDetalleCancionesEvento;
        }
    };
});

import { ControladorEstadisticas } from './controlador-estadisticas';

describe('ControladorEstadisticas', () => {
    let controller: ControladorEstadisticas;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorEstadisticas();
        
        jsonMock = vi.fn();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        req = {
            params: {},
            query: {}
        };
        res = {
            status: statusMock,
            json: jsonMock
        };
    });

    describe('obtenerEstadisticasEvento', () => {
        it('should return 400 if eventoId is missing', async () => {
            req.params = {};
            await controller.obtenerEstadisticasEvento(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'EventoId es requerido' });
        });

        it('should return statistics on success', async () => {
            req.params = { eventoId: 'event-123' };
            const mockStats = { totalPedidos: 10 };
            mockObtenerEstadisticasEvento.mockResolvedValue(mockStats);

            await controller.obtenerEstadisticasEvento(req as Request, res as Response);

            expect(mockObtenerEstadisticasEvento).toHaveBeenCalledWith('event-123');
            expect(jsonMock).toHaveBeenCalledWith(mockStats);
        });

        it('should return 404 if event not found', async () => {
            req.params = { eventoId: 'event-404' };
            mockObtenerEstadisticasEvento.mockRejectedValue(new Error('Evento no encontrado'));

            await controller.obtenerEstadisticasEvento(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Evento no encontrado' });
        });

        it('should return 500 on server error', async () => {
            req.params = { eventoId: 'event-500' };
            mockObtenerEstadisticasEvento.mockRejectedValue(new Error('Internal database error'));

            await controller.obtenerEstadisticasEvento(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
        });
    });

    describe('obtenerEstadisticasArtista', () => {
        it('should return 400 if perfilArtistaId is missing', async () => {
            req.params = {};
            await controller.obtenerEstadisticasArtista(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'PerfilArtistaId es requerido' });
        });

        it('should return statistics on success', async () => {
            req.params = { perfilArtistaId: 'artist-123' };
            const mockStats = { totalPedidos: 20 };
            mockObtenerEstadisticasArtista.mockResolvedValue(mockStats);

            await controller.obtenerEstadisticasArtista(req as Request, res as Response);

            expect(mockObtenerEstadisticasArtista).toHaveBeenCalledWith('artist-123');
            expect(jsonMock).toHaveBeenCalledWith(mockStats);
        });

        it('should return 500 on error', async () => {
            req.params = { perfilArtistaId: 'artist-500' };
            mockObtenerEstadisticasArtista.mockRejectedValue(new Error('DB Error'));

            await controller.obtenerEstadisticasArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
        });
    });

    describe('obtenerGenerosArtista', () => {
        it('should return 400 if perfilArtistaId is missing', async () => {
            req.params = {};
            await controller.obtenerGenerosArtista(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'PerfilArtistaId es requerido' });
        });

        it('should return only genres and total requests', async () => {
            req.params = { perfilArtistaId: 'artist-123' };
            mockObtenerEstadisticasArtista.mockResolvedValue({
                generosPorConteo: [{ genero: 'Rock', conteo: 5 }],
                totalPedidos: 5,
                topCanciones: []
            });

            await controller.obtenerGenerosArtista(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({
                generosPorConteo: [{ genero: 'Rock', conteo: 5 }],
                totalPedidos: 5
            });
        });

        it('should return 500 on error', async () => {
            req.params = { perfilArtistaId: 'artist-500' };
            mockObtenerEstadisticasArtista.mockRejectedValue(new Error('DB Error'));

            await controller.obtenerGenerosArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerTopCanciones', () => {
        it('should return 400 if perfilArtistaId is missing', async () => {
            req.params = {};
            await controller.obtenerTopCanciones(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return sliced top songs', async () => {
            req.params = { perfilArtistaId: 'artist-123' };
            req.query = { limit: '2' };
            mockObtenerEstadisticasArtista.mockResolvedValue({
                topCanciones: [{ titulo: 'Song 1' }, { titulo: 'Song 2' }, { titulo: 'Song 3' }],
                totalPedidos: 10
            });

            await controller.obtenerTopCanciones(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({
                topCanciones: [{ titulo: 'Song 1' }, { titulo: 'Song 2' }],
                totalPedidos: 10
            });
        });

        it('should return default 20 sliced top songs if limit is not specified', async () => {
            req.params = { perfilArtistaId: 'artist-123' };
            req.query = {};
            mockObtenerEstadisticasArtista.mockResolvedValue({
                topCanciones: new Array(25).fill(null).map((_, i) => ({ titulo: `Song ${i}` })),
                totalPedidos: 100
            });

            await controller.obtenerTopCanciones(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({
                topCanciones: new Array(20).fill(null).map((_, i) => ({ titulo: `Song ${i}` })),
                totalPedidos: 100
            });
        });

        it('should return 500 on error', async () => {
            req.params = { perfilArtistaId: 'artist-500' };
            mockObtenerEstadisticasArtista.mockRejectedValue(new Error('DB Error'));

            await controller.obtenerTopCanciones(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerDetalleCancionesArtista', () => {
        it('should return 400 if perfilArtistaId is missing', async () => {
            req.params = {};
            await controller.obtenerDetalleCancionesArtista(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should call service with queries and return results', async () => {
            req.params = { perfilArtistaId: 'artist-123' };
            req.query = { page: '2', limit: '5', search: 'Pop', ordenarPor: 'recientes' };
            const mockResult = { canciones: [], total: 0 };
            mockObtenerDetalleCancionesArtista.mockResolvedValue(mockResult);

            await controller.obtenerDetalleCancionesArtista(req as Request, res as Response);

            expect(mockObtenerDetalleCancionesArtista).toHaveBeenCalledWith(
                'artist-123', 2, 5, 'Pop', 'recientes'
            );
            expect(jsonMock).toHaveBeenCalledWith(mockResult);
        });

        it('should return 500 on error', async () => {
            req.params = { perfilArtistaId: 'artist-500' };
            mockObtenerDetalleCancionesArtista.mockRejectedValue(new Error('DB Error'));

            await controller.obtenerDetalleCancionesArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerDetalleCancionesEvento', () => {
        it('should return 400 if eventoId is missing', async () => {
            req.params = {};
            await controller.obtenerDetalleCancionesEvento(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should call service with queries and return results', async () => {
            req.params = { eventoId: 'event-123' };
            req.query = { page: '3', limit: '10', search: 'Rock', ordenarPor: 'aceptadas' };
            const mockResult = { canciones: [], total: 0 };
            mockObtenerDetalleCancionesEvento.mockResolvedValue(mockResult);

            await controller.obtenerDetalleCancionesEvento(req as Request, res as Response);

            expect(mockObtenerDetalleCancionesEvento).toHaveBeenCalledWith(
                'event-123', 3, 10, 'Rock', 'aceptadas'
            );
            expect(jsonMock).toHaveBeenCalledWith(mockResult);
        });

        it('should return 500 on error', async () => {
            req.params = { eventoId: 'event-500' };
            mockObtenerDetalleCancionesEvento.mockRejectedValue(new Error('DB Error'));

            await controller.obtenerDetalleCancionesEvento(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});
