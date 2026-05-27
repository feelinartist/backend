import { Request, Response } from "express";
import { EstadisticasService } from "../../application/services/estadisticas-service";

export class ControladorEstadisticas {
    private estadisticasService: EstadisticasService;

    constructor() {
        this.estadisticasService = new EstadisticasService();
    }

    /**
     * GET /api/estadisticas/evento/:eventoId
     * Obtiene estadísticas de un evento específico
     */
    obtenerEstadisticasEvento = async (req: Request, res: Response) => {
        try {
            const { eventoId } = req.params;

            if (!eventoId) {
                return res.status(400).json({ error: "EventoId es requerido" });
            }

            const estadisticas = await this.estadisticasService.obtenerEstadisticasEvento(eventoId);
            return res.json(estadisticas);
        } catch (error) {
            console.error("Error al obtener estadísticas del evento:", error);
            const err = error as Error;

            if (err.message === "Evento no encontrado") {
                return res.status(404).json({ error: err.message });
            }

            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    /**
     * GET /api/estadisticas/artista/:perfilArtistaId
     * Obtiene estadísticas globales de un artista
     */
    obtenerEstadisticasArtista = async (req: Request, res: Response) => {
        try {
            const { perfilArtistaId } = req.params;

            if (!perfilArtistaId) {
                return res.status(400).json({ error: "PerfilArtistaId es requerido" });
            }

            const estadisticas = await this.estadisticasService.obtenerEstadisticasArtista(perfilArtistaId);
            return res.json(estadisticas);
        } catch (error) {
            console.error("Error al obtener estadísticas del artista:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    /**
     * GET /api/estadisticas/artista/:perfilArtistaId/generos
     * Obtiene solo la distribución de géneros del artista
     */
    obtenerGenerosArtista = async (req: Request, res: Response) => {
        try {
            const { perfilArtistaId } = req.params;

            if (!perfilArtistaId) {
                return res.status(400).json({ error: "PerfilArtistaId es requerido" });
            }

            const estadisticas = await this.estadisticasService.obtenerEstadisticasArtista(perfilArtistaId);
            return res.json({
                generosPorConteo: estadisticas.generosPorConteo,
                totalPedidos: estadisticas.totalPedidos
            });
        } catch (error) {
            console.error("Error al obtener géneros del artista:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    /**
     * GET /api/estadisticas/artista/:perfilArtistaId/top-canciones
     * Obtiene solo las canciones más pedidas del artista
     */
    obtenerTopCanciones = async (req: Request, res: Response) => {
        try {
            const { perfilArtistaId } = req.params;
            const limit = parseInt(req.query.limit as string) || 20;

            if (!perfilArtistaId) {
                return res.status(400).json({ error: "PerfilArtistaId es requerido" });
            }

            const estadisticas = await this.estadisticasService.obtenerEstadisticasArtista(perfilArtistaId);
            return res.json({
                topCanciones: estadisticas.topCanciones.slice(0, limit),
                totalPedidos: estadisticas.totalPedidos
            });
        } catch (error) {
            console.error("Error al obtener top canciones:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    /**
     * GET /api/estadisticas/artista/:perfilArtistaId/canciones
     * Obtiene detalle paginado de todas las canciones del artista
     */
    obtenerDetalleCancionesArtista = async (req: Request, res: Response) => {
        try {
            const { perfilArtistaId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = (req.query.search as string) || '';
            const ordenarPor = (req.query.ordenarPor as "pedidas" | "aceptadas" | "rechazadas" | "recientes") || 'pedidas';

            if (!perfilArtistaId) {
                return res.status(400).json({ error: "PerfilArtistaId es requerido" });
            }

            const result = await this.estadisticasService.obtenerDetalleCancionesArtista(
                perfilArtistaId,
                page,
                limit,
                search,
                ordenarPor
            );
            return res.json(result);
        } catch (error) {
            console.error("Error al obtener detalle de canciones:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    /**
     * GET /api/estadisticas/evento/:eventoId/canciones
     * Obtiene detalle paginado de todas las canciones del evento
     */
    obtenerDetalleCancionesEvento = async (req: Request, res: Response) => {
        try {
            const { eventoId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = (req.query.search as string) || '';
            const ordenarPor = (req.query.ordenarPor as "pedidas" | "aceptadas" | "rechazadas" | "recientes") || 'pedidas';

            if (!eventoId) {
                return res.status(400).json({ error: "eventoId es requerido" });
            }

            const result = await this.estadisticasService.obtenerDetalleCancionesEvento(
                eventoId,
                page,
                limit,
                search,
                ordenarPor
            );
            return res.json(result);
        } catch (error) {
            console.error("Error al obtener detalle de canciones de evento:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };
}
