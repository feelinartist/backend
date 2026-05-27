import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO } from '../../domain/entities/user';
import prisma from '../database/prisma';
import { Prisma } from '@prisma/client';
import { LocalFileService } from '../services/local-file-service';
import { redisService } from '../services/redis-service';

const localFileService = new LocalFileService();

const usuarioInclude = {
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
} as const;

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
                include: usuarioInclude
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
                ...usuarioInclude,
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
        // 1. Try to get from Redis Cache if public request (no solicitor)
        const cacheKey = `user:profile:${nombreUsuario}`;
        if (!usuarioSolicitanteId) {
            try {
                const cached = await redisService.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            } catch (err) {
                console.warn('Redis Cache Error (Profile):', err);
            }
        }

        const usuario = await prisma.usuario.findUnique({
            where: { nombreUsuario },
            include: {
                ...usuarioInclude,
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

        const entity = this.mapToEntity(usuario);

        // 2. Save to Cache if public request
        if (!usuarioSolicitanteId) {
            try {
                // Cache for 10 minutes
                await redisService.set(cacheKey, JSON.stringify(entity), 600);
            } catch (err) {
                console.warn('Redis Save Cache Error (Profile):', err);
            }
        }

        return entity;
    }

    async actualizar(id: string, datos: ActualizarUsuarioDTO): Promise<Usuario> {
        const datosActualizacion = await this.buildUpdateData(id, datos);

        // Fetch previous state for correct cache invalidation
        const usuarioAnterior = await prisma.usuario.findUnique({
            where: { id },
            select: { nombreUsuario: true }
        });

        const usuario = await prisma.usuario.update({
            where: { id },
            data: datosActualizacion,
            include: usuarioInclude
        });

        // 🧹 Cache Invalidation: Delete old and new username keys
        try {
            if (usuarioAnterior?.nombreUsuario) {
                await redisService.del(`user:profile:${usuarioAnterior.nombreUsuario}`);
            }
            if (usuario.nombreUsuario && usuario.nombreUsuario !== usuarioAnterior?.nombreUsuario) {
                await redisService.del(`user:profile:${usuario.nombreUsuario}`);
            }
        } catch (err) {
            console.error('Error invalidating cache:', err);
        }

        return this.mapToEntity(usuario);
    }

    private async buildUpdateData(id: string, datos: ActualizarUsuarioDTO): Promise<Record<string, unknown>> {
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
            datosActualizacion.perfilArtista = await this.preparePerfilArtistaUpsert(id, datos.perfilArtista);
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

        return datosActualizacion;
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
                    include: usuarioInclude
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
            include: usuarioInclude
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
                const regex = /\/uploads\/(.+)\.\w+$/;
                const match = regex.exec(url);
                return match ? match[1] : null;
            }

            const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
            const match = regex.exec(url);
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

    private mapRedesSociales(redesSociales: Record<string, any>[], userId: string) {
        return redesSociales.map((r) => {
            let finalUsuario = r.nombreUsuario;
            if (!finalUsuario && (r.codigoTelefono || r.numeroTelefono)) {
                finalUsuario = `${r.codigoTelefono || ''}${r.numeroTelefono || ''}`.trim();
            }
            return {
                redSocialId: r.redSocialId,
                nombreUsuario: finalUsuario || '',
                creadoPor: userId
            };
        });
    }

    private mapMetodosDonacion(metodosDonacion: Record<string, any>[], userId: string) {
        return metodosDonacion.map((m) => ({
            metodoDonacionId: m.metodoDonacionId,
            numeroCuenta: m.numeroCuenta || m.identificador || m.numeroTelefono || '',
            creadoPor: userId
        }));
    }

    private mapGaleria(galeria: (string | { urlImagen: string })[], userId: string) {
        return galeria.map((item) => ({
            urlImagen: typeof item === 'string' ? item : item.urlImagen,
            creadoPor: userId
        }));
    }

    private async preparePerfilArtistaUpsert(id: string, perfilArtistaDto: any): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { redesSociales, metodosDonacion, galeria, pagoQR, musicQR, nombreQR, urlPago, nombreUsuario: _nombreUsuario, ...perfilArtistaData } = perfilArtistaDto;

        const nestedUpdate = await this.buildNestedUpdate({
            id,
            perfilArtistaData,
            pagoQR,
            musicQR,
            nombreQR,
            urlPago,
            redesSociales,
            metodosDonacion,
            galeria
        });
        const createRelations = this.buildCreateRelations(id, redesSociales, metodosDonacion, galeria);

        const createData = {
            categoria: 'SOLISTA',
            biografia: '',
            tarifaPorHora: 0,
            moneda: 'PEN',
            zonaHoraria: 'America/Lima',
            ...perfilArtistaData,
            lugaresConocidos: perfilArtistaData.lugaresConocidos,
            creadoPor: id,
            pagoQR: pagoQR as string | undefined,
            musicQR: musicQR as string | undefined,
            nombreQR: nombreQR as string | undefined,
            urlPago: urlPago as string | undefined,
            ...createRelations
        };

        return {
            upsert: {
                create: createData,
                update: nestedUpdate
            }
        };
    }

    private async updateQrsAndUrls(id: string, pagoQR: any, musicQR: any, nombreQR: any, urlPago: any, nestedUpdate: Record<string, any>): Promise<void> {
        if (pagoQR !== undefined) {
            await this.deleteOldPagoQR(id, pagoQR);
            nestedUpdate.pagoQR = pagoQR;
        }
        if (musicQR !== undefined) nestedUpdate.musicQR = musicQR;
        if (nombreQR !== undefined) nestedUpdate.nombreQR = nombreQR;
        if (urlPago !== undefined) nestedUpdate.urlPago = urlPago;
    }

    private async updateRelations(id: string, redesSociales: any, metodosDonacion: any, galeria: any, nestedUpdate: Record<string, any>): Promise<void> {
        if (redesSociales && Array.isArray(redesSociales)) {
            nestedUpdate.redesSociales = {
                deleteMany: {},
                create: this.mapRedesSociales(redesSociales, id)
            };
        }

        if (metodosDonacion && Array.isArray(metodosDonacion)) {
            nestedUpdate.metodosDonacion = {
                deleteMany: {},
                create: this.mapMetodosDonacion(metodosDonacion, id)
            };
        }

        if (galeria && Array.isArray(galeria)) {
            await this.deleteOldGaleria(id);
            nestedUpdate.galeria = {
                deleteMany: {},
                create: this.mapGaleria(galeria, id)
            };
        }
    }

    private async buildNestedUpdate(input: {
        id: string;
        perfilArtistaData: any;
        pagoQR: any;
        musicQR: any;
        nombreQR: any;
        urlPago: any;
        redesSociales: any;
        metodosDonacion: any;
        galeria: any;
    }): Promise<Record<string, unknown>> {
        const { id, perfilArtistaData, pagoQR, musicQR, nombreQR, urlPago, redesSociales, metodosDonacion, galeria } = input;
        const nestedUpdate: Record<string, unknown> = {
            ...perfilArtistaData,
            lugaresConocidos: perfilArtistaData.lugaresConocidos,
            actualizadoPor: id
        };

        await this.updateQrsAndUrls(id, pagoQR, musicQR, nombreQR, urlPago, nestedUpdate);
        await this.updateRelations(id, redesSociales, metodosDonacion, galeria, nestedUpdate);

        return nestedUpdate;
    }

    private addRedesSocialesRelation(id: string, redesSociales: any, target: Record<string, any>): void {
        if (redesSociales && Array.isArray(redesSociales)) {
            target.redesSociales = {
                create: this.mapRedesSociales(redesSociales, id)
            };
        }
    }

    private addMetodosDonacionRelation(id: string, metodosDonacion: any, target: Record<string, any>): void {
        if (metodosDonacion && Array.isArray(metodosDonacion)) {
            target.metodosDonacion = {
                create: this.mapMetodosDonacion(metodosDonacion, id)
            };
        }
    }

    private addGaleriaRelation(id: string, galeria: any, target: Record<string, any>): void {
        if (galeria && Array.isArray(galeria)) {
            target.galeria = {
                create: this.mapGaleria(galeria, id)
            };
        }
    }

    private buildCreateRelations(
        id: string,
        redesSociales: any,
        metodosDonacion: any,
        galeria: any
    ): Record<string, unknown> {
        const createRelations: Record<string, unknown> = {};
        this.addRedesSocialesRelation(id, redesSociales, createRelations);
        this.addMetodosDonacionRelation(id, metodosDonacion, createRelations);
        this.addGaleriaRelation(id, galeria, createRelations);
        return createRelations;
    }

    private async deleteOldPagoQR(id: string, nuevoPagoQR: string | undefined): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingProfile = await (prisma.perfilArtista as any).findUnique({
            where: { usuarioId: id },
            select: { pagoQR: true }
        });

        if (existingProfile?.pagoQR && existingProfile.pagoQR !== nuevoPagoQR) {
            const publicId = this.extractPublicIdFromUrl(existingProfile.pagoQR);
            if (publicId) {
                try {
                    await localFileService.deleteImage(publicId);
                } catch (error) {
                    console.error('Error deleting QR image:', error);
                }
            }
        }
    }

    private async deleteOldGaleria(id: string): Promise<void> {
        const existingProfile = await prisma.perfilArtista.findUnique({
            where: { usuarioId: id },
            select: { id: true }
        });
        if (!existingProfile?.id) return;

        const existingGallery = await prisma.galeriaArtista.findMany({
            where: { perfilArtistaId: existingProfile.id },
            select: { urlImagen: true }
        });

        if (existingGallery.length > 0) {
            const publicIds = existingGallery
                .map(img => this.extractPublicIdFromUrl(img.urlImagen))
                .filter(id => id !== null) as string[];

            if (publicIds.length > 0) {
                try {
                    await Promise.all(publicIds.map(pid => localFileService.deleteImage(pid)));
                } catch (error) {
                    console.error('Error deleting images:', error);
                }
            }
        }
    }
}
