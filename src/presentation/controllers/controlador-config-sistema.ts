import { Request, Response, NextFunction } from "express";
import { PrismaConfigSistemaRepository } from "../../infrastructure/repositories/prisma-config-sistema-repository";

export class ControladorConfigSistema {
    private readonly configRepository: PrismaConfigSistemaRepository;

    constructor() {
        this.configRepository = new PrismaConfigSistemaRepository();
    }

    // Middleware to check if user is SUPERADMIN or ADMIN
    verificarAcceso = (req: Request, res: Response, next: NextFunction) => {
        const user = (req as Request & { user?: { rol: string } }).user;
        const userRole = user?.rol; // Assuming user is attached to request

        if (userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
            return res.status(403).json({ error: "Acceso denegado. Solo SUPERADMIN y ADMIN pueden acceder." });
        }

        next();
    };

    listarTodas = async (req: Request, res: Response) => {
        try {
            const configs = await this.configRepository.obtenerTodas();
            return res.json(configs);
        } catch (error) {
            console.error("Error al listar configuraciones:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    obtenerPorClave = async (req: Request, res: Response) => {
        try {
            const clave = req.params.clave as string;
            const config = await this.configRepository.obtenerPorClave(clave);

            if (!config) {
                return res.status(404).json({ error: "Configuración no encontrada" });
            }

            return res.json(config);
        } catch (error) {
            console.error("Error al obtener configuración:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    crear = async (req: Request, res: Response) => {
        try {
            const { clave, valor, descripcion } = req.body;
            const userId = (req as Request & { user?: { id: string } }).user?.id;

            if (!clave || !valor) {
                return res.status(400).json({ error: "Clave y valor son requeridos" });
            }

            const config = await this.configRepository.crear({
                clave,
                valor,
                descripcion,
                creadoPor: userId
            });

            return res.status(201).json(config);
        } catch (error) {
            console.error("Error al crear configuración:", error);
            const err = error as { code?: string };

            if (err.code === 'P2002') {
                return res.status(400).json({ error: "Ya existe una configuración con esa clave" });
            }

            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    actualizar = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const { valor } = req.body;
            const userId = (req as Request & { user?: { id: string } }).user?.id;

            if (!valor) {
                return res.status(400).json({ error: "Valor es requerido" });
            }

            const config = await this.configRepository.actualizar(id, valor, userId);
            return res.json(config);
        } catch (error) {
            console.error("Error al actualizar configuración:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    eliminar = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            await this.configRepository.eliminar(id);
            return res.json({ message: "Configuración eliminada correctamente" });
        } catch (error) {
            console.error("Error al eliminar configuración:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };
}
