import { Request, Response } from 'express';
import { RepositorioConfigPrisma } from '../../infrastructure/repositories/prisma-config-repository';

const repositorioConfig = new RepositorioConfigPrisma();

export class ControladorAdminConfig {

    // REDES SOCIALES
    async listarRedesSociales(req: Request, res: Response) {
        try {
            const redes = await repositorioConfig.listarRedesSociales();
            return res.status(200).json(redes);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al listar redes sociales' });
        }
    }

    async crearRedSocial(req: Request, res: Response) {
        try {
            const { nombre, urlBase, icono } = req.body;
            if (!nombre || !urlBase) return res.status(400).json({ message: 'Nombre y URL base requeridos' });

            const red = await repositorioConfig.crearRedSocial({ nombre, urlBase, icono });
            return res.status(201).json(red);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al crear red social' });
        }
    }

    async actualizarRedSocial(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;
            const red = await repositorioConfig.actualizarRedSocial(id, data);
            return res.status(200).json(red);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al actualizar red social' });
        }
    }

    async eliminarRedSocial(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await repositorioConfig.eliminarRedSocial(id);
            return res.status(200).json({ message: 'Red social eliminada' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al eliminar red social' });
        }
    }

    // METODOS DONACION
    async listarMetodosDonacion(req: Request, res: Response) {
        try {
            const metodos = await repositorioConfig.listarMetodosDonacion();
            return res.status(200).json(metodos);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al listar métodos de donación' });
        }
    }

    async crearMetodoDonacion(req: Request, res: Response) {
        try {
            const { nombre, icono } = req.body;
            if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });

            const metodo = await repositorioConfig.crearMetodoDonacion({ nombre, icono });
            return res.status(201).json(metodo);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al crear método de donación' });
        }
    }

    async actualizarMetodoDonacion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;
            const metodo = await repositorioConfig.actualizarMetodoDonacion(id, data);
            return res.status(200).json(metodo);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al actualizar método de donación' });
        }
    }

    async eliminarMetodoDonacion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await repositorioConfig.eliminarMetodoDonacion(id);
            return res.status(200).json({ message: 'Método de donación eliminado' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al eliminar método de donación' });
        }
    }

    // ROLES
    async listarRoles(req: Request, res: Response) {
        try {
            const roles = await repositorioConfig.listarRoles();
            return res.status(200).json(roles);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error al listar roles' });
        }
    }
}
