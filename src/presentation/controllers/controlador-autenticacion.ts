import { Request, Response } from 'express';
import { CrearUsuarioCasoUso } from '../../application/use-cases/crear-usuario';
import { RepositorioUsuarioPrisma } from '../../infrastructure/repositories/prisma-user-repository';
import { generateToken } from '../../middleware/auth';

const repositorioUsuario = new RepositorioUsuarioPrisma();
const crearUsuarioCasoUso = new CrearUsuarioCasoUso(repositorioUsuario);

export class ControladorAutenticacion {
    async iniciarSesion(req: Request, res: Response) {
        try {
            const { correo, nombre, imagen } = req.body;

            if (!correo) {
                return res.status(400).json({ message: 'El correo es requerido' });
            }

            const usuario = await crearUsuarioCasoUso.ejecutar({ correo, nombre, imagen });

            // Generate a real JWT for the frontend to use in subsequent API calls
            const token = generateToken({
                id: usuario.id,
                email: usuario.correo,
                rol: usuario.rol?.nombre
            });

            return res.status(200).json({ ...usuario, token });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}
