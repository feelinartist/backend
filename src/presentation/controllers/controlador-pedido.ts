
import { Request, Response } from "express";
import { PrismaPedidoRepository } from "../../infrastructure/repositories/prisma-pedido-repository";
import { EstadoPedidoCancion, PrismaClient } from "@prisma/client";
import { SocketService } from '../../infrastructure/services/socket-service';

const prisma = new PrismaClient();

export class ControladorPedido {
    private pedidoRepository: PrismaPedidoRepository;

    constructor() {
        this.pedidoRepository = new PrismaPedidoRepository();
    }

    crearPedido = async (req: Request, res: Response) => {
        try {
            const { eventoId, titulo, artista, usuarioId, itunesId, nombreSolicitante, genero, imagenUrl, previewUrl } = req.body;

            if (!eventoId || !titulo) {
                return res.status(400).json({ error: "EventoId y Título son requeridos" });
            }

            // Validar si el artista está aceptando pedidos
            const evento = await prisma.evento.findUnique({
                where: { id: eventoId },
                include: { perfilArtista: true }
            });

            if (!evento) {
                return res.status(404).json({ error: "Evento no encontrado" });
            }

            if (!evento.perfilArtista.pedidosActivos) {
                return res.status(403).json({ error: "El artista no está recibiendo pedidos en este momento" });
            }

            const pedido = await this.pedidoRepository.crearPedido(
                eventoId,
                titulo,
                artista,
                usuarioId,
                itunesId,
                nombreSolicitante,
                genero,
                imagenUrl,
                previewUrl
            );

            // Emitir evento por Socket.io
            try {
                const io = SocketService.getInstance().getIO();
                io.to(`event:${eventoId}`).emit('nuevo_pedido', pedido);
            } catch (error) {
                console.error('Error emitiendo socket:', error);
            }

            return res.status(201).json(pedido);
        } catch (error) {
            console.error("Error al crear pedido:", error);
            const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
            return res.status(500).json({ error: errorMessage });
        }
    };

    obtenerPedidosPorEvento = async (req: Request, res: Response) => {
        try {
            const { eventoId } = req.params;
            const pedidos = await this.pedidoRepository.obtenerPedidosPorEvento(eventoId);
            return res.json(pedidos);
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    actualizarEstado = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!Object.values(EstadoPedidoCancion).includes(estado)) {
                return res.status(400).json({ error: "Estado inválido" });
            }

            const pedido = await this.pedidoRepository.actualizarEstado(id, estado);
            return res.json(pedido);
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };
}
