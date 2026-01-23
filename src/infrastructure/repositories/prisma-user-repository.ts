import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO } from '../../domain/entities/user';
import prisma from '../database/prisma';
import { Prisma } from '@prisma/client';
import { LocalFileService } from '../services/local-file-service';

const localFileService = new LocalFileService();

export class RepositorioUsuarioPrisma implements RepositorioUsuario {
    async crear(datos: CrearUsuarioDTO): Promise<Usuario> {
        const usuario = await prisma.usuario.create({
            data: {
                correo: datos.correo,
                nombre: datos.nombre,
                imagen: datos.imagen,
                nombreUsuario: datos.nombreUsuario,
                rol: datos.rol ? {
                    connect: { nombre: datos.rol }
                } : undefined,
            },
            include: { rol: true }
        });

        // Update creadoPor with the user's own ID after creation
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { creadoPor: usuario.id }
        });

        return this.mapToEntity(usuario);
    }

    async buscarPorCorreo(correo: string): Promise<Usuario | null> {
        try {
            const usuario = await prisma.usuario.findUnique({
                where: { correo },
                include: {
                    rol: true,
                    perfilArtista: {
                        include: {
                            redesSociales: { include: { redSocial: true } },
                            metodosDonacion: { include: { metodoDonacion: true } },
                            galeria: true
                        }
                    },
                    perfilPublico: true,
                    perfilDiscoteca: true
                }
            });
            console.log(`[Repo] findUnique RESULT: ${usuario ? 'FOUND ' + usuario.id : 'NULL'}`);
            if (!usuario) return null;
            return this.mapToEntity(usuario);
        } catch (error) {
            console.error('[Repo] findUnique ERROR:', error);
            throw error;
        }
    }

    async buscarPorId(id: string, usuarioSolicitanteId?: string): Promise<Usuario | null> {
        const usuario = await prisma.usuario.findUnique({
            where: { id },
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true,
                ...(usuarioSolicitanteId ? {
                    bloqueados: { where: { bloqueadoId: usuarioSolicitanteId } },
                    bloqueadoPor: { where: { bloqueadorId: usuarioSolicitanteId } }
                } : {})
            }
        });

        if (!usuario) return null;

        if (usuarioSolicitanteId) {

            if (usuario.bloqueados?.length > 0 || usuario.bloqueadoPor?.length > 0) {
                return null;
            }
        }

        return this.mapToEntity(usuario);
    }

    async buscarPorNombreUsuario(nombreUsuario: string, usuarioSolicitanteId?: string): Promise<Usuario | null> {
        const usuario = await prisma.usuario.findUnique({
            where: { nombreUsuario },
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true,
                ...(usuarioSolicitanteId ? {
                    bloqueados: { where: { bloqueadoId: usuarioSolicitanteId } },
                    bloqueadoPor: { where: { bloqueadorId: usuarioSolicitanteId } }
                } : {})
            }
        });

        if (!usuario) return null;

        if (usuarioSolicitanteId) {

            if (usuario.bloqueados?.length > 0 || usuario.bloqueadoPor?.length > 0) {
                return null;
            }
        }

        return this.mapToEntity(usuario);
    }

    async actualizar(id: string, datos: ActualizarUsuarioDTO): Promise<Usuario> {
        const datosActualizacion: Record<string, unknown> = {};

        if (datos.rol) {
            datosActualizacion.rol = {
                connect: { nombre: datos.rol }
            };
        }

        if (datos.nombre) datosActualizacion.nombre = datos.nombre;
        if (datos.imagen) datosActualizacion.imagen = datos.imagen;
        if (datos.nombreUsuario) datosActualizacion.nombreUsuario = datos.nombreUsuario;
        if (datos.ultimoCambioNombreUsuario) datosActualizacion.ultimoCambioNombreUsuario = datos.ultimoCambioNombreUsuario;
        if (datos.ultimoCambioNombre) datosActualizacion.ultimoCambioNombre = datos.ultimoCambioNombre;
        if (datos.estadoCuenta) datosActualizacion.estadoCuenta = datos.estadoCuenta;
        if (datos.fechaEliminacionProgramada) datosActualizacion.fechaEliminacionProgramada = datos.fechaEliminacionProgramada;
        if (datos.perfilCompletadoReconocido !== undefined) datosActualizacion.perfilCompletadoReconocido = datos.perfilCompletadoReconocido;

        // Audit field: track who is updating
        datosActualizacion.actualizadoPor = id;

        if (datos.perfilArtista) {
            const { redesSociales, metodosDonacion, galeria, pagoQR, musicQR, nombreQR, urlPago, nombreUsuario, ...perfilArtistaData } = datos.perfilArtista;

            // Explicitly handle lugaresConocidos to avoid spread loss
            const nestedUpdate: Record<string, unknown> = {
                ...perfilArtistaData,
                lugaresConocidos: perfilArtistaData.lugaresConocidos,
                actualizadoPor: id // Audit: track who is updating
            };

            // Handle pagoQR, naming, and urlPago at PerfilArtista level
            if (pagoQR !== undefined) {
                // Get existing QR image
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const existingProfile = await (prisma.perfilArtista as any).findUnique({
                    where: { usuarioId: id },
                    select: { pagoQR: true }
                });

                if (existingProfile?.pagoQR && existingProfile.pagoQR !== pagoQR) {
                    const publicId = this.extractPublicIdFromUrl(existingProfile.pagoQR);
                    if (publicId) {
                        try {
                            await localFileService.deleteImage(publicId);
                        } catch (error) {
                            console.error('Error deleting QR image:', error);
                            // Continue...
                        }
                    }
                }

                nestedUpdate.pagoQR = pagoQR;
            }
            if (musicQR !== undefined) nestedUpdate.musicQR = musicQR;
            if (nombreQR !== undefined) nestedUpdate.nombreQR = nombreQR;
            if (urlPago !== undefined) nestedUpdate.urlPago = urlPago;




            // Handle Nested Relations
            // Note: We use deleteMany/create approach for simplicity as requested by "paso a paso" wizard nature
            if (redesSociales && Array.isArray(redesSociales)) {
                nestedUpdate.redesSociales = {
                    deleteMany: {},
                    create: redesSociales.map((r: Record<string, unknown>) => {
                        // Logic to handle phone number storage in 'nombreUsuario' if that's how we store it
                        // Or ensure frontend sends 'nombreUsuario' for whatsapp too.
                        // Assuming schema only has nombreUsuario:
                        let finalUsuario = r.nombreUsuario;
                        if (!finalUsuario && (r.codigoTelefono || r.numeroTelefono)) {
                            finalUsuario = `${r.codigoTelefono || ''}${r.numeroTelefono || ''}`.trim();
                        }
                        return {
                            redSocialId: r.redSocialId,
                            nombreUsuario: finalUsuario || '',
                            creadoPor: id // Audit: track who created this
                        };
                    })
                };
            }

            if (metodosDonacion && Array.isArray(metodosDonacion)) {
                nestedUpdate.metodosDonacion = {
                    deleteMany: {},
                    create: metodosDonacion.map((m: Record<string, unknown>) => ({
                        metodoDonacionId: m.metodoDonacionId,
                        numeroCuenta: m.numeroCuenta || m.identificador || m.numeroTelefono || '',
                        creadoPor: id // Audit: track who created this
                    }))
                };
            }

            if (galeria && Array.isArray(galeria)) {
                const existingGallery = await prisma.galeriaArtista.findMany({
                    where: { perfilArtistaId: (await prisma.perfilArtista.findUnique({ where: { usuarioId: id } }))?.id },
                    select: { urlImagen: true }
                });

                // Extract publicIds from URLs and delete
                if (existingGallery.length > 0) {
                    const publicIds = existingGallery
                        .map(img => this.extractPublicIdFromUrl(img.urlImagen))
                        .filter(id => id !== null) as string[];

                    if (publicIds.length > 0) {
                        try {
                            // LocalFileService doesn't have deleteImages (plural), iterate
                            await Promise.all(publicIds.map(pid => localFileService.deleteImage(pid)));
                        } catch (error) {
                            console.error('Error deleting images:', error);
                        }
                    }
                }

                nestedUpdate.galeria = {
                    deleteMany: {},
                    create: galeria.map((item: string | { urlImagen: string }) => ({
                        urlImagen: typeof item === 'string' ? item : item.urlImagen,
                        creadoPor: id // Audit: track who created this
                    }))
                };
            }

            // Prepare relations for CREATE (clean insert)
            const createRelations: Record<string, unknown> = {};
            if (redesSociales && Array.isArray(redesSociales)) {
                createRelations.redesSociales = {
                    create: redesSociales.map((r: Record<string, unknown>) => {
                        let finalUsuario = r.nombreUsuario;
                        if (!finalUsuario && (r.codigoTelefono || r.numeroTelefono)) {
                            finalUsuario = `${r.codigoTelefono || ''}${r.numeroTelefono || ''}`.trim();
                        }
                        return {
                            redSocialId: r.redSocialId,
                            nombreUsuario: finalUsuario || '',
                            creadoPor: id // Audit: track who created this
                        };
                    })
                };
            }
            if (metodosDonacion && Array.isArray(metodosDonacion)) {
                createRelations.metodosDonacion = {
                    create: metodosDonacion.map((m: Record<string, unknown>) => ({
                        metodoDonacionId: m.metodoDonacionId,
                        numeroCuenta: m.numeroCuenta || m.identificador || m.numeroTelefono || '',
                        creadoPor: id // Audit: track who created this
                    }))
                };
            }
            if (galeria && Array.isArray(galeria)) {
                createRelations.galeria = {
                    create: galeria.map((item: string | { urlImagen: string }) => ({
                        urlImagen: typeof item === 'string' ? item : item.urlImagen,
                        creadoPor: id // Audit: track who created this
                    }))
                };
            }

            // Ensure we have defaults for required fields if creating a new profile
            const createData = {
                categoria: 'SOLISTA',
                biografia: '',
                tarifaPorHora: 0,
                moneda: 'PEN',
                zonaHoraria: 'America/Lima',
                ...perfilArtistaData,
                lugaresConocidos: perfilArtistaData.lugaresConocidos, // Explicit assignment
                creadoPor: id, // Audit: track who created this profile
                ...createRelations
            };

            datosActualizacion.perfilArtista = {
                upsert: {
                    create: createData,
                    update: nestedUpdate
                }
            };
        }

        if (datos.perfilPublico) {
            datosActualizacion.perfilPublico = {
                upsert: {
                    create: { ...datos.perfilPublico, creadoPor: id },
                    update: { ...datos.perfilPublico, actualizadoPor: id }
                }
            };
        }

        if (datos.perfilDiscoteca) {
            datosActualizacion.perfilDiscoteca = {
                upsert: {
                    create: { ...datos.perfilDiscoteca, creadoPor: id },
                    update: { ...datos.perfilDiscoteca, actualizadoPor: id }
                }
            };
        }

        const usuario = await prisma.usuario.update({
            where: { id },
            data: datosActualizacion,
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true
            }
        });
        return this.mapToEntity(usuario);
    }

    async bloquear(bloqueadorId: string, bloqueadoId: string): Promise<void> {
        await prisma.bloqueo.create({
            data: {
                bloqueadorId,
                bloqueadoId,
                creadoPor: bloqueadorId // Audit: the blocker is the creator
            }
        });
    }

    async desbloquear(bloqueadorId: string, bloqueadoId: string): Promise<void> {
        await prisma.bloqueo.deleteMany({
            where: {
                bloqueadorId,
                bloqueadoId
            }
        });
    }

    async obtenerBloqueados(bloqueadorId: string): Promise<Usuario[]> {
        const bloqueos = await prisma.bloqueo.findMany({
            where: { bloqueadorId },
            include: {
                bloqueado: {
                    include: {
                        rol: true,
                        perfilArtista: {
                            include: {
                                redesSociales: { include: { redSocial: true } },
                                metodosDonacion: { include: { metodoDonacion: true } },
                                galeria: true
                            }
                        },
                        perfilPublico: true,
                        perfilDiscoteca: true
                    }
                }
            }
        });
        return bloqueos.map(b => this.mapToEntity(b.bloqueado));
    }

    async buscarArtistas(filtro: { termino?: string; paisId?: string; usuarioSolicitanteId?: string }): Promise<Usuario[]> {
        const { termino, paisId, usuarioSolicitanteId } = filtro;

        const usuarios = await prisma.usuario.findMany({
            where: {
                rol: { nombre: 'ARTISTA' },
                estadoCuenta: 'ACTIVO',
                // Exclude users who blocked the requester or are blocked by the requester
                ...(usuarioSolicitanteId ? {
                    bloqueados: { none: { bloqueadoId: usuarioSolicitanteId } },
                    bloqueadoPor: { none: { bloqueadorId: usuarioSolicitanteId } },
                } : {}),
                AND: [
                    termino ? {
                        OR: [
                            { nombre: { contains: termino } },
                            { nombreUsuario: { contains: termino } }
                        ]
                    } : {},
                    paisId ? {
                        OR: [
                            { perfilArtista: { pais: { contains: paisId } } },
                            { perfilDiscoteca: { pais: { contains: paisId } } }
                        ]
                    } : {}
                ]
            },
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true
            }
        });

        return usuarios.map(u => this.mapToEntity(u));
    }

    // Removed obtenerPaises and obtenerCiudades as tables are gone
    async obtenerPaises(): Promise<Record<string, unknown>[]> { return []; }
    async obtenerCiudades(_paisId: string): Promise<Record<string, unknown>[]> { return []; }

    async listarUsuarios(page: number = 1, limit: number = 20, termino?: string): Promise<{ usuarios: Usuario[], total: number }> {
        const skip = (page - 1) * limit;

        const where: Prisma.UsuarioWhereInput = termino ? {
            OR: [
                { nombre: { contains: termino } },
                { correo: { contains: termino } },
                { nombreUsuario: { contains: termino } }
            ]
        } : {};

        const [usuarios, total] = await Promise.all([
            prisma.usuario.findMany({
                where,
                skip,
                take: limit,
                include: {
                    rol: true,
                    perfilArtista: {
                        include: {
                            redesSociales: { include: { redSocial: true } },
                            metodosDonacion: { include: { metodoDonacion: true } },
                            galeria: true,
                            eventos: { where: { activo: true } }
                        }
                    },
                    perfilPublico: true,
                    perfilDiscoteca: true
                },
                orderBy: { creadoEn: 'desc' }
            }),
            prisma.usuario.count({ where })
        ]);

        return {
            usuarios: usuarios.map(u => this.mapToEntity(u)),
            total
        };
    }

    async eliminarPermanente(id: string): Promise<void> {
        await prisma.usuario.delete({
            where: { id }
        });
    }

    /**
     * Extract publicId (relative path without extension) from a URL
     */
    private extractPublicIdFromUrl(url: string): string | null {
        try {
            // 1. Handle Local URLs: /uploads/users/123/profile/abc.webp
            // We want: users/123/profile/abc
            if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
                const match = url.match(/\/uploads\/(.+)\.\w+$/);
                return match ? match[1] : null;
            }

            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Error extracting publicId from URL:', url, error);
            return null;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToEntity(prismaUser: any): Usuario {
        return {
            id: prismaUser.id,
            correo: prismaUser.correo,
            nombre: prismaUser.nombre,
            imagen: prismaUser.imagen,
            nombreUsuario: prismaUser.nombreUsuario,
            rol: prismaUser.rol ? { id: prismaUser.rol.id, nombre: prismaUser.rol.nombre } : null,
            perfilArtista: prismaUser.perfilArtista ? {
                ...prismaUser.perfilArtista,
                // Ensure dates/decimals are handled if needed, but for now spread is okay
            } : undefined,
            perfilPublico: prismaUser.perfilPublico ? {
                ...prismaUser.perfilPublico
            } : undefined,
            perfilDiscoteca: prismaUser.perfilDiscoteca ? {
                ...prismaUser.perfilDiscoteca
            } : undefined,
            creadoEn: prismaUser.creadoEn,
            actualizadoEn: prismaUser.actualizadoEn,
            ultimoCambioNombreUsuario: prismaUser.ultimoCambioNombreUsuario,
            ultimoCambioNombre: prismaUser.ultimoCambioNombre,
            estadoCuenta: prismaUser.estadoCuenta,
            fechaEliminacionProgramada: prismaUser.fechaEliminacionProgramada,
            perfilCompletadoReconocido: prismaUser.perfilCompletadoReconocido,
        };
    }
}
