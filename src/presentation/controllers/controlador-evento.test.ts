import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Setup mock spies prefixed with 'mock' for Vitest hoisting
const mockCrearEvento = vi.fn();
const mockFinalizarEvento = vi.fn();
const mockObtenerEventoActivo = vi.fn();
const mockTogglePedidos = vi.fn();
const mockObtenerEventosPorArtista = vi.fn();
const mockObtenerEventosPaginados = vi.fn();

vi.mock('../../infrastructure/repositories/prisma-evento-repository', () => {
    return {
        PrismaEventoRepository: class MockPrismaEventoRepository {
            crearEvento = mockCrearEvento;
            finalizarEvento = mockFinalizarEvento;
            obtenerEventoActivo = mockObtenerEventoActivo;
            togglePedidos = mockTogglePedidos;
            obtenerEventosPorArtista = mockObtenerEventosPorArtista;
            obtenerEventosPaginados = mockObtenerEventosPaginados;
        }
    };
});

const mockEmit = vi.fn();
const mockTo = vi.fn().mockImplementation(() => ({ emit: mockEmit }));
const mockIO = { to: mockTo };

vi.mock('../../infrastructure/services/socket-service', () => {
    return {
        SocketService: {
            getInstance: () => ({
                getIO: () => mockIO
            })
        }
    };
});

import { ControladorEvento } from './controlador-evento';

describe('ControladorEvento', () => {
    let controller: ControladorEvento;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorEvento();
        
        jsonMock = vi.fn();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: statusMock,
            json: jsonMock
        };
    });

    describe('crearEvento', () => {
        it('should return 400 if title or artistId is missing', async () => {
            req.body = { titulo: '', artistaId: '' };
            await controller.crearEvento(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Título y artistaId son requeridos' });
        });

        it('should create event successfully and emit socket events', async () => {
            req.body = { titulo: 'Show', descripcion: 'Live', artistaId: 'art-1', latitud: 12.3, longitud: 45.6 };
            const mockEvent = { id: 'event-1', perfilArtistaId: 'art-1' };
            mockCrearEvento.mockResolvedValue(mockEvent);

            await controller.crearEvento(req as Request, res as Response);

            expect(mockCrearEvento).toHaveBeenCalledWith('art-1', 'Show', 'Live', 12.3, 45.6);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockEvent);
            expect(mockTo).toHaveBeenCalledWith('artist:art-1');
            expect(mockEmit).toHaveBeenCalledWith('event_started', { eventId: 'event-1' });
        });

        it('should create event successfully even if socket emission throws', async () => {
            req.body = { titulo: 'Show', artistaId: 'art-1' };
            const mockEvent = { id: 'event-1', perfilArtistaId: 'art-1' };
            mockCrearEvento.mockResolvedValue(mockEvent);

            mockTo.mockImplementationOnce(() => {
                throw new Error('Socket issue');
            });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crearEvento(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockEvent);
            expect(consoleSpy).toHaveBeenCalledWith('Error emitting socket event (event_started):', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('should return 500 on repository error', async () => {
            req.body = { titulo: 'Show', artistaId: 'art-1' };
            mockCrearEvento.mockRejectedValue(new Error('DB Error'));

            await controller.crearEvento(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
        });
    });

    describe('finalizarEvento', () => {
        it('should finalize event successfully and notify rooms', async () => {
            req.params = { id: 'event-1' };
            const mockEvent = { id: 'event-1', perfilArtistaId: 'art-1' };
            mockFinalizarEvento.mockResolvedValue(mockEvent);

            await controller.finalizarEvento(req as Request, res as Response);

            expect(mockFinalizarEvento).toHaveBeenCalledWith('event-1');
            expect(jsonMock).toHaveBeenCalledWith(mockEvent);
            expect(mockTo).toHaveBeenCalledWith('event:event-1');
            expect(mockTo).toHaveBeenCalledWith('artist:art-1');
            expect(mockEmit).toHaveBeenCalledWith('event_ended', { eventId: 'event-1' });
        });

        it('should finalize event successfully even if socket throws', async () => {
            req.params = { id: 'event-1' };
            const mockEvent = { id: 'event-1', perfilArtistaId: 'art-1' };
            mockFinalizarEvento.mockResolvedValue(mockEvent);

            mockTo.mockImplementationOnce(() => {
                throw new Error('Socket issue');
            });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.finalizarEvento(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(mockEvent);
            expect(consoleSpy).toHaveBeenCalledWith('Error emitting socket event (event_ended):', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('should return 500 on repository error', async () => {
            req.params = { id: 'event-1' };
            mockFinalizarEvento.mockRejectedValue(new Error('DB Error'));

            await controller.finalizarEvento(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerEventoActivo', () => {
        it('should return active event', async () => {
            req.params = { artistaId: 'art-1' };
            const mockEvent = { id: 'event-1' };
            mockObtenerEventoActivo.mockResolvedValue(mockEvent);

            await controller.obtenerEventoActivo(req as Request, res as Response);

            expect(mockObtenerEventoActivo).toHaveBeenCalledWith('art-1');
            expect(jsonMock).toHaveBeenCalledWith(mockEvent);
        });

        it('should return null if no active event found', async () => {
            req.params = { artistaId: 'art-1' };
            mockObtenerEventoActivo.mockResolvedValue(null);

            await controller.obtenerEventoActivo(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(null);
        });

        it('should return 500 on repository error', async () => {
            req.params = { artistaId: 'art-1' };
            mockObtenerEventoActivo.mockRejectedValue(new Error('DB Error'));

            await controller.obtenerEventoActivo(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('togglePedidos', () => {
        it('should return 400 on invalid or missing data', async () => {
            req.body = { artistaId: '', activo: 'not-bool' };
            await controller.togglePedidos(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);

            req.body = { artistaId: 'art-1', activo: undefined };
            await controller.togglePedidos(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should toggle and emit socket event on success', async () => {
            req.body = { artistaId: 'art-1', activo: 'true' }; // robust parsing string test
            const mockResult = { id: 'art-1', activo: true };
            mockTogglePedidos.mockResolvedValue(mockResult);
            mockObtenerEventoActivo.mockResolvedValue({ id: 'event-active' });

            await controller.togglePedidos(req as Request, res as Response);

            expect(mockTogglePedidos).toHaveBeenCalledWith('art-1', true);
            expect(jsonMock).toHaveBeenCalledWith(mockResult);
            expect(mockTo).toHaveBeenCalledWith('artist:art-1');
            expect(mockTo).toHaveBeenCalledWith('event:event-active');
            expect(mockEmit).toHaveBeenCalledWith('pedidos_status', { activo: true });
        });

        it('should toggle and handle when no active event exists', async () => {
            req.body = { artistaId: 'art-1', activo: false }; // direct boolean test
            const mockResult = { id: 'art-1', activo: false };
            mockTogglePedidos.mockResolvedValue(mockResult);
            mockObtenerEventoActivo.mockResolvedValue(null);

            await controller.togglePedidos(req as Request, res as Response);

            expect(mockTogglePedidos).toHaveBeenCalledWith('art-1', false);
            expect(jsonMock).toHaveBeenCalledWith(mockResult);
            expect(mockTo).toHaveBeenCalledWith('artist:art-1');
            expect(mockTo).not.toHaveBeenCalledWith('event:event-active');
            expect(mockEmit).toHaveBeenCalledWith('pedidos_status', { activo: false });
        });

        it('should handle socket error inside togglePedidos gracefully', async () => {
            req.body = { artistaId: 'art-1', activo: true };
            const mockResult = { id: 'art-1' };
            mockTogglePedidos.mockResolvedValue(mockResult);
            mockTo.mockImplementationOnce(() => {
                throw new Error('Socket failed');
            });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.togglePedidos(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(mockResult);
            expect(consoleSpy).toHaveBeenCalledWith('Error emitting socket event:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('should fallback to body artistaId if repository result does not contain id', async () => {
            req.body = { artistaId: 'art-fallback', activo: true };
            const mockResultWithoutId = { activo: true };
            mockTogglePedidos.mockResolvedValue(mockResultWithoutId);
            mockObtenerEventoActivo.mockResolvedValue(null);

            await controller.togglePedidos(req as Request, res as Response);

            expect(mockTo).toHaveBeenCalledWith('artist:art-fallback');
        });

        it('should return 500 on repository error', async () => {
            req.body = { artistaId: 'art-1', activo: true };
            mockTogglePedidos.mockRejectedValue(new Error('DB Error'));

            await controller.togglePedidos(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerEventosPorArtista', () => {
        it('should return artist events list', async () => {
            req.params = { perfilArtistaId: 'art-1' };
            const mockEvents = [{ id: 'event-1' }];
            mockObtenerEventosPorArtista.mockResolvedValue(mockEvents);

            await controller.obtenerEventosPorArtista(req as Request, res as Response);

            expect(mockObtenerEventosPorArtista).toHaveBeenCalledWith('art-1');
            expect(jsonMock).toHaveBeenCalledWith(mockEvents);
        });

        it('should return 500 on repository error', async () => {
            req.params = { perfilArtistaId: 'art-1' };
            mockObtenerEventosPorArtista.mockRejectedValue(new Error('DB Error'));

            await controller.obtenerEventosPorArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerEventosPaginados', () => {
        it('should return paginated events list with parsed queries', async () => {
            req.params = { perfilArtistaId: 'art-1' };
            req.query = { page: '2', limit: '10', search: 'jazz' };
            const mockResult = { eventos: [], total: 0 };
            mockObtenerEventosPaginados.mockResolvedValue(mockResult);

            await controller.obtenerEventosPaginados(req as Request, res as Response);

            expect(mockObtenerEventosPaginados).toHaveBeenCalledWith('art-1', 2, 10, 'jazz');
            expect(jsonMock).toHaveBeenCalledWith(mockResult);
        });

        it('should return 500 on repository error', async () => {
            req.params = { perfilArtistaId: 'art-1' };
            mockObtenerEventosPaginados.mockRejectedValue(new Error('DB error'));

            await controller.obtenerEventosPaginados(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});
