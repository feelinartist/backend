import { Request, Response } from 'express';
import { ActualizarRolUsuarioCasoUso } from '../../application/use-cases/actualizar-rol-usuario';
import { RepositorioUsuarioPrisma } from '../../infrastructure/repositories/prisma-user-repository';
import { VerificarDisponibilidadUsuarioCasoUso } from '../../application/use-cases/verificar-disponibilidad-usuario';
import { generateToken } from '../../middleware/auth';
import prisma from '../../infrastructure/database/prisma';

import { ActualizarUsuarioCasoUso } from '../../application/use-cases/actualizar-usuario';

import { GestionCuentaCasoUso } from '../../application/use-cases/gestion-cuenta';
import { BloquearUsuarioCasoUso } from '../../application/use-cases/bloquear-usuario';
import { BuscarArtistasCasoUso } from '../../application/use-cases/buscar-artistas';
import { MigrarRolUsuarioCasoUso } from '../../application/use-cases/migrar-rol-usuario';

const repositorioUsuario = new RepositorioUsuarioPrisma();
const actualizarRolUsuarioCasoUso = new ActualizarRolUsuarioCasoUso(repositorioUsuario);
const verificarDisponibilidadUsuarioCasoUso = new VerificarDisponibilidadUsuarioCasoUso(repositorioUsuario);
const actualizarUsuarioCasoUso = new ActualizarUsuarioCasoUso(repositorioUsuario);
const gestionCuentaCasoUso = new GestionCuentaCasoUso(repositorioUsuario);
const bloquearUsuarioCasoUso = new BloquearUsuarioCasoUso(repositorioUsuario);
const buscarArtistasCasoUso = new BuscarArtistasCasoUso(repositorioUsuario);
const migrarRolUsuarioCasoUso = new MigrarRolUsuarioCasoUso(repositorioUsuario);

export class ControladorUsuario {
    // ... existing methods ...

    async listarUsuarios(req: Request, res: Response) {
        try {
            const page = Number.parseInt(req.query.page as string) || 1;
            const limit = Number.parseInt(req.query.limit as string) || 20;
            const termino = req.query.termino as string;

            const result = await repositorioUsuario.listarUsuarios(page, limit, termino);
            return res.status(200).json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async deshabilitarCuenta(req: Request, res: Response) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId) return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await gestionCuentaCasoUso.deshabilitarCuenta(usuarioId);
            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async eliminarCuenta(req: Request, res: Response) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId) return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await gestionCuentaCasoUso.programarEliminacion(usuarioId);
            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async reactivarCuenta(req: Request, res: Response) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId) return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await gestionCuentaCasoUso.reactivarCuenta(usuarioId);
            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async banearUsuario(req: Request, res: Response) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId) return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await gestionCuentaCasoUso.banearUsuario(usuarioId);
            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async eliminarPermanente(req: Request, res: Response) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId) return res.status(400).json({ message: 'ID de usuario es requerido' });
            await gestionCuentaCasoUso.eliminarUsuarioPermanente(usuarioId);
            return res.status(200).json({ message: 'Usuario eliminado permanentemente' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async bloquearUsuario(req: Request, res: Response) {
        try {
            const { bloqueadorId, bloqueadoId } = req.body;
            if (!bloqueadorId || !bloqueadoId) return res.status(400).json({ message: 'IDs son requeridos' });
            await bloquearUsuarioCasoUso.bloquear(bloqueadorId, bloqueadoId);
            return res.status(200).json({ message: 'Usuario bloqueado' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: (error as Error).message || 'Error interno del servidor' });
        }
    }

    async desbloquearUsuario(req: Request, res: Response) {
        try {
            const { bloqueadorId, bloqueadoId } = req.body;
            if (!bloqueadorId || !bloqueadoId) return res.status(400).json({ message: 'IDs son requeridos' });
            await bloquearUsuarioCasoUso.desbloquear(bloqueadorId, bloqueadoId);
            return res.status(200).json({ message: 'Usuario desbloqueado' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async obtenerBloqueados(req: Request, res: Response) {
        try {
            const { bloqueadorId } = req.params;
            if (!bloqueadorId) return res.status(400).json({ message: 'ID de usuario es requerido' });
            const bloqueados = await bloquearUsuarioCasoUso.obtenerBloqueados(bloqueadorId);
            return res.status(200).json(bloqueados);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async buscarArtistas(req: Request, res: Response) {
        try {
            const { termino, paisId, usuarioSolicitanteId } = req.query;

            const artistas = await buscarArtistasCasoUso.ejecutar({
                termino: termino as string,
                paisId: paisId as string,
                usuarioSolicitanteId: usuarioSolicitanteId as string
            });
            return res.status(200).json(artistas);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async migrarRol(req: Request, res: Response) {
        try {
            const { usuarioId, nuevoRol, datosPerfil } = req.body;
            if (!usuarioId || !nuevoRol) return res.status(400).json({ message: 'ID de usuario y nuevo rol son requeridos' });

            const usuario = await migrarRolUsuarioCasoUso.ejecutar(usuarioId, nuevoRol, datosPerfil || {});
            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: (error as Error).message || 'Error al migrar rol' });
        }
    }

    async actualizarRol(req: Request, res: Response) {
        try {
            const { correo, rol, ...datosPerfil } = req.body;

            if (!correo || !rol) {
                return res.status(400).json({ message: 'Correo y rol son requeridos' });
            }

            let datosArtista = undefined;
            let datosPublico = undefined;
            let datosDiscoteca: Record<string, unknown> | undefined = undefined;
            const nombreUsuario = datosPerfil.nombreUsuario;
            let nombre = undefined;

            if (rol === 'ARTISTA') {
                const { nombreArtistico, ciudadId, paisId, ...restoArtista } = datosPerfil;
                datosArtista = {
                    ...restoArtista,
                    ciudad: ciudadId,
                    pais: paisId
                };
                nombre = nombreArtistico;
            } else if (rol === 'PUBLICO') {
                const { nombre: nombrePublico, ...restoPublico } = datosPerfil;
                datosPublico = restoPublico;
                nombre = nombrePublico;
            } else if (rol === 'DISCOTECA') {
                datosDiscoteca = {
                    ciudad: datosPerfil.ciudadId,
                    pais: datosPerfil.paisId,
                    fechaFundacion: datosPerfil.fechaFundacion,
                    codigoTelefono: datosPerfil.codigoTelefono,
                    numeroTelefono: datosPerfil.numeroTelefono,
                    zonaHoraria: datosPerfil.zonaHoraria
                };
                nombre = datosPerfil.nombre;
            }

            const usuario = await actualizarRolUsuarioCasoUso.ejecutar(correo, rol, datosArtista, datosPublico, datosDiscoteca, nombreUsuario, nombre);

            // Generate a fresh JWT with the updated role
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

    async verificarNombreUsuario(req: Request, res: Response) {
        try {
            const { nombreUsuario } = req.body;

            if (!nombreUsuario) {
                return res.status(400).json({ message: 'Nombre de usuario es requerido' });
            }

            const resultado = await verificarDisponibilidadUsuarioCasoUso.ejecutar(nombreUsuario);
            return res.status(200).json(resultado);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async actualizarPerfil(req: Request, res: Response) {
        try {
            const {
                usuarioId,
                nombre,
                nombreUsuario,
                nombreArtistico,
                pais,
                ciudad,
                zonaHoraria,
                telefono,
                codigoTelefono,
                redesSociales,
                metodosDonacion,
                galeria,
                // Artist Profile Fields
                biografia,
                categoria,
                tarifaPorHora,
                moneda,
                lugaresConocidos,
                fechaInicio,
                fechaFundacion,
                // QR and Payment Fields
                pagoQR,
                musicQR,
                nombreQR,
                urlPago,
                urlYoutubeFavorito,
                urlSoundCloudFavorito,
                // Administration
                rol,
                estadoCuenta
            } = req.body;

            if (!usuarioId) {
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            }

            const usuario = await actualizarUsuarioCasoUso.ejecutar({
                usuarioId,
                nombre,
                nombreUsuario,
                nombreArtistico,
                pais,
                ciudad,
                zonaHoraria,
                telefono,
                codigoTelefono,
                redesSociales,
                metodosDonacion,
                galeria,
                biografia,
                categoria,
                tarifaPorHora,
                moneda,
                lugaresConocidos,
                fechaInicio,
                fechaFundacion,
                pagoQR,
                musicQR,
                nombreQR,
                urlPago,
                urlYoutubeFavorito,
                urlSoundCloudFavorito,
                rol,
                estadoCuenta
            });

            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            const err = error as Error;
            if (err.message?.includes("Debes esperar") || err.message?.includes("ya está en uso")) {
                return res.status(400).json({ message: err.message });
            }
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async obtenerPerfil(req: Request, res: Response) {
        try {
            const { usuarioId } = req.params;
            if (!usuarioId) return res.status(400).json({ message: 'ID de usuario es requerido' });

            const usuario = await repositorioUsuario.buscarPorId(usuarioId);
            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async obtenerPaises(req: Request, res: Response) {
        try {
            const paises = await repositorioUsuario.obtenerPaises();
            return res.status(200).json(paises);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async obtenerCiudades(req: Request, res: Response) {
        try {
            const { paisId } = req.params;
            if (!paisId) return res.status(400).json({ message: 'ID de país es requerido' });
            const ciudades = await repositorioUsuario.obtenerCiudades(paisId);
            return res.status(200).json(ciudades);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async marcarPerfilCompletadoReconocido(req: Request, res: Response) {
        try {
            const { usuarioId, perfilCompletadoReconocido } = req.body;
            if (!usuarioId) return res.status(400).json({ message: 'ID de usuario es requerido' });

            // Use provided value or default to true for backward compatibility with existing calls
            const valor = perfilCompletadoReconocido === undefined ? true : perfilCompletadoReconocido;

            const usuario = await repositorioUsuario.actualizar(usuarioId, {
                perfilCompletadoReconocido: valor
            });

            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async obtenerPerfilPublico(req: Request, res: Response) {
        try {
            const { username } = req.params;
            const { usuarioSolicitanteId } = req.query;

            if (!username) return res.status(400).json({ message: 'Nombre de usuario es requerido' });

            const usuario = await repositorioUsuario.buscarPorNombreUsuario(username, usuarioSolicitanteId as string);

            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado o perfil no accesible' });

            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async eliminarPerfilEspecifico(req: Request, res: Response) {
        try {
            // Check if requester is admin
            const user = (req as Request & { user?: { id: string; rol: string } }).user;
            if (!user || (user.rol !== 'SUPER_ADMIN' && user.rol !== 'ADMIN')) {
                return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
            }

            const { tipo } = req.params;
            const usuarioId = user.id;

            if (tipo === 'artista') {
                // Find and delete the profile and related entities
                const perfil = await prisma.perfilArtista.findUnique({ where: { usuarioId } });
                if (perfil) {
                    await prisma.$transaction([
                        prisma.artistaRedSocial.deleteMany({ where: { perfilArtistaId: perfil.id } }),
                        prisma.artistaDonacion.deleteMany({ where: { perfilArtistaId: perfil.id } }),
                        prisma.galeriaArtista.deleteMany({ where: { perfilArtistaId: perfil.id } }),
                        prisma.evento.deleteMany({ where: { perfilArtistaId: perfil.id } }),
                        prisma.seguidor.deleteMany({ where: { artistaSeguidoId: perfil.id } }),
                        prisma.perfilArtista.delete({ where: { id: perfil.id } })
                    ]);
                }
            } else if (tipo === 'publico') {
                await prisma.perfilPublico.deleteMany({ where: { usuarioId } });
            } else if (tipo === 'discoteca') {
                const perfil = await prisma.perfilDiscoteca.findUnique({ where: { usuarioId } });
                if (perfil) {
                    await prisma.$transaction([
                        prisma.seguidor.deleteMany({ where: { perfilDiscotecaId: perfil.id } }),
                        prisma.perfilDiscoteca.delete({ where: { id: perfil.id } })
                    ]);
                }
            } else {
                return res.status(400).json({ message: 'Tipo de perfil no válido' });
            }

            return res.status(200).json({ message: 'Perfil eliminado con éxito' });
        } catch (error) {
            console.error('Error eliminando perfil específico:', error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}
