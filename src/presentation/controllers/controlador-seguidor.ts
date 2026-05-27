import { Request, Response } from 'express';
import { SeguirUsuarioCasoUso } from '../../application/use-cases/seguir-usuario';
import { DejarDeSeguirUsuarioCasoUso } from '../../application/use-cases/dejar-de-seguir-usuario';
import { RepositorioSeguidorPrisma } from '../../infrastructure/repositories/prisma-seguidor-repository';

const repositorioSeguidor = new RepositorioSeguidorPrisma();
const seguirUsuarioCasoUso = new SeguirUsuarioCasoUso(repositorioSeguidor);
const dejarDeSeguirUsuarioCasoUso = new DejarDeSeguirUsuarioCasoUso(repositorioSeguidor);

export class ControladorSeguidor {
    async seguir(req: Request, res: Response) {
        try {
            const { seguidorId, seguidoId, tipo } = req.body;
            if (!seguidorId || !seguidoId || !tipo) {
                return res.status(400).json({ message: 'Faltan datos requeridos' });
            }
            await seguirUsuarioCasoUso.ejecutar(seguidorId, seguidoId, tipo);
            return res.status(200).json({ message: 'Usuario seguido exitosamente' });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: (error as Error).message || 'Error al seguir usuario' });
        }
    }

    async dejarDeSeguir(req: Request, res: Response) {
        try {
            const { seguidorId, seguidoId, tipo } = req.body;
            if (!seguidorId || !seguidoId || !tipo) {
                return res.status(400).json({ message: 'Faltan datos requeridos' });
            }
            await dejarDeSeguirUsuarioCasoUso.ejecutar(seguidorId, seguidoId, tipo);
            return res.status(200).json({ message: 'Dejado de seguir exitosamente' });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: (error as Error).message || 'Error al dejar de seguir usuario' });
        }
    }
}
