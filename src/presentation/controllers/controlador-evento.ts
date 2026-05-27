
import { Request, Response } from "express";
import { PrismaEventoRepository } from "../../infrastructure/repositories/prisma-evento-repository";
import { SocketService } from "../../infrastructure/services/socket-service";

export class ControladorEvento {
    private eventoRepository: PrismaEventoRepository;

    constructor() {
        this.eventoRepository = new PrismaEventoRepository();
    }

    crearEvento = async (req: Request, res: Response) => {
        try {
            const { titulo, descripcion, artistaId, latitud, longitud } = req.body;

            // Basic validation
            if (!titulo || !artistaId) {
                return res.status(400).json({ error: "Título y artistaId son requeridos" });
            }

            const evento = await this.eventoRepository.crearEvento(
                artistaId,
                titulo,
                descripcion,
                latitud,
                longitud
            );

            // Notify via Socket.io
            try {
                const io = SocketService.getInstance().getIO();
                const resolvedArtistaId = evento.perfilArtistaId;
                const roomName = `artist:${resolvedArtistaId}`;

                console.log(`Socket: Notifying rooms of new event for artist ${resolvedArtistaId}`);

                // Emit both to cover all listener types
                io.to(roomName).emit('event_started', { eventId: evento.id });
                io.to(roomName).emit('pedidos_status', { activo: true });
            } catch (socketError) {
                console.error("Error emitting socket event (event_started):", socketError);
            }

            return res.status(201).json(evento);
        } catch (error) {
            console.error("Error al crear evento:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    finalizarEvento = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const evento = await this.eventoRepository.finalizarEvento(id);

            // Notify via Socket.io
            try {
                const io = SocketService.getInstance().getIO();
                const resolvedArtistaId = evento.perfilArtistaId;
                const roomName = `artist:${resolvedArtistaId}`;
                const eventRoom = `event:${id}`;

                console.log(`Socket: Notifying rooms of event end for artist ${resolvedArtistaId}`);

                io.to(eventRoom).emit('event_ended', { eventId: id });
                io.to(roomName).emit('event_ended', { eventId: id });
                io.to(roomName).emit('pedidos_status', { activo: false });
            } catch (socketError) {
                console.error("Error emitting socket event (event_ended):", socketError);
            }

            return res.json(evento);
        } catch (error) {
            console.error("Error al finalizar evento:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    obtenerEventoActivo = async (req: Request, res: Response) => {
        try {
            const { artistaId } = req.params;
            const evento = await this.eventoRepository.obtenerEventoActivo(artistaId);
            return res.json(evento || null); // Return null if no active event
        } catch (error) {
            console.error("Error al obtener evento activo:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    togglePedidos = async (req: Request, res: Response) => {
        try {
            const { artistaId, activo } = req.body;

            let activoBool = activo;
            // Robust parsing
            if (typeof activo === 'string') {
                activoBool = activo === 'true';
            }

            if (typeof activoBool !== 'boolean' || !artistaId) {
                return res.status(400).json({ error: "Datos inválidos" });
            }

            const result = await this.eventoRepository.togglePedidos(artistaId, activoBool);

            // Notify via Socket.io
            try {
                const io = SocketService.getInstance().getIO();
                // We need the resolved artistId for the room. The repository should ideally return it.
                // For now, we'll fetch it if needed or assume the repo does its job.
                // Let's use the result from the repository which we will update to include the id.
                const resolvedArtistaId = (result as { id: string }).id || artistaId;
                const roomName = `artist:${resolvedArtistaId}`;

                console.log(`Socket: Emitting pedidos_status to room ${roomName}: ${activoBool}`);
                io.to(roomName).emit('pedidos_status', { activo: activoBool });

                const activeEvent = await this.eventoRepository.obtenerEventoActivo(artistaId);
                if (activeEvent) {
                    io.to(`event:${activeEvent.id}`).emit('pedidos_status', { activo: activoBool });
                }
            } catch (socketError) {
                console.error("Error emitting socket event:", socketError);
            }

            return res.json(result);
        } catch (error) {
            console.error("Error al cambiar estado de pedidos:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    obtenerEventosPorArtista = async (req: Request, res: Response) => {
        try {
            const { perfilArtistaId } = req.params;
            const eventos = await this.eventoRepository.obtenerEventosPorArtista(perfilArtistaId);
            return res.json(eventos);
        } catch (error) {
            console.error("Error al obtener eventos del artista:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    obtenerEventosPaginados = async (req: Request, res: Response) => {
        try {
            const { perfilArtistaId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string;

            const result = await this.eventoRepository.obtenerEventosPaginados(perfilArtistaId, page, limit, search);
            return res.json(result);
        } catch (error) {
            console.error("Error al obtener eventos paginados:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };
}
