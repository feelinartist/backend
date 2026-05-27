import { RepositorioSeguidor } from '../../domain/repositories/seguidor-repository';
import { Usuario } from '../../domain/entities/user';
import prisma from '../database/prisma';

export class RepositorioSeguidorPrisma implements RepositorioSeguidor {
    async seguir(seguidorId: string, seguidoId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<void> {
        // First verify if the target profile exists
        if (tipo === 'ARTISTA') {
            const artista = await prisma.perfilArtista.findUnique({ where: { usuarioId: seguidoId } });
            if (!artista) throw new Error("Artista no encontrado");

            await prisma.seguidor.create({
                data: {
                    seguidorId,
                    artistaSeguidoId: artista.id
                }
            });
        } else {
            const discoteca = await prisma.perfilDiscoteca.findUnique({ where: { usuarioId: seguidoId } });
            if (!discoteca) throw new Error("Discoteca no encontrada");

            await prisma.seguidor.create({
                data: {
                    seguidorId,
                    perfilDiscotecaId: discoteca.id
                }
            });
        }
    }

    async dejarDeSeguir(seguidorId: string, seguidoId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<void> {
        if (tipo === 'ARTISTA') {
            const artista = await prisma.perfilArtista.findUnique({ where: { usuarioId: seguidoId } });
            if (!artista) return; // Or throw error

            await prisma.seguidor.deleteMany({
                where: {
                    seguidorId,
                    artistaSeguidoId: artista.id
                }
            });
        } else {
            const discoteca = await prisma.perfilDiscoteca.findUnique({ where: { usuarioId: seguidoId } });
            if (!discoteca) return;

            await prisma.seguidor.deleteMany({
                where: {
                    seguidorId,
                    perfilDiscotecaId: discoteca.id
                }
            });
        }
    }

    async esSeguidor(seguidorId: string, seguidoId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<boolean> {
        if (tipo === 'ARTISTA') {
            const artista = await prisma.perfilArtista.findUnique({ where: { usuarioId: seguidoId } });
            if (!artista) return false;

            const count = await prisma.seguidor.count({
                where: {
                    seguidorId,
                    artistaSeguidoId: artista.id
                }
            });
            return count > 0;
        } else {
            const discoteca = await prisma.perfilDiscoteca.findUnique({ where: { usuarioId: seguidoId } });
            if (!discoteca) return false;

            const count = await prisma.seguidor.count({
                where: {
                    seguidorId,
                    perfilDiscotecaId: discoteca.id
                }
            });
            return count > 0;
        }
    }

    async obtenerSeguidores(usuarioId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<Usuario[]> {
        // This gets who follows the user (usuarioId is the target)
        if (tipo === 'ARTISTA') {
            const artista = await prisma.perfilArtista.findUnique({ where: { usuarioId } });
            if (!artista) return [];

            const seguidores = await prisma.seguidor.findMany({
                where: { artistaSeguidoId: artista.id }
            });
            // Here we would ideally fetch the user details of the followers. 
            // For simplicity, returning the raw records or we can join with Usuario.
            // Let's assume we want user details.
            // Since seguidorId is just a string in the model (no relation defined back to Usuario in schema yet for seguidorId field?), 
            // we might need to fetch them manually or update schema to have relation on seguidorId.
            // Looking at schema: seguidorId String. No relation.
            // We should probably add relation to Usuario for seguidorId to make this efficient.
            // For now, let's fetch manually.
            const ids = seguidores.map(s => s.seguidorId);
            return prisma.usuario.findMany({ where: { id: { in: ids } } });
        } else {
            const discoteca = await prisma.perfilDiscoteca.findUnique({ where: { usuarioId } });
            if (!discoteca) return [];

            const seguidores = await prisma.seguidor.findMany({
                where: { perfilDiscotecaId: discoteca.id }
            });
            const ids = seguidores.map(s => s.seguidorId);
            return prisma.usuario.findMany({ where: { id: { in: ids } } });
        }
    }

    async obtenerSeguidos(usuarioId: string): Promise<Record<string, unknown>[]> {
        // This gets who the user follows
        const seguidos = await prisma.seguidor.findMany({
            where: { seguidorId: usuarioId },
            include: {
                artista: { include: { usuario: true } },
                perfilDiscoteca: { include: { usuario: true } }
            }
        });

        return seguidos.map(s => {
            if (s.artista) {
                return { tipo: 'ARTISTA', ...s.artista.usuario, perfil: s.artista };
            } else if (s.perfilDiscoteca) {
                return { tipo: 'DISCOTECA', ...s.perfilDiscoteca.usuario, perfil: s.perfilDiscoteca };
            }
            return null;
        }).filter(Boolean) as Record<string, unknown>[];
    }
}
