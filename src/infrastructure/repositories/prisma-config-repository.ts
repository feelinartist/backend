import { PrismaClient, RedSocial, MetodoDonacion } from '@prisma/client';
import { RepositorioConfig } from '../../domain/repositories/config-repository';
import { Rol } from '../../domain/entities/user';

export class RepositorioConfigPrisma implements RepositorioConfig {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // Redes Sociales
    async listarRedesSociales(): Promise<RedSocial[]> {
        return this.prisma.redSocial.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' }
        });
    }

    async crearRedSocial(data: { nombre: string; urlBase: string; icono?: string }): Promise<RedSocial> {
        return this.prisma.redSocial.create({ data });
    }

    async actualizarRedSocial(id: string, data: Partial<RedSocial>): Promise<RedSocial> {
        return this.prisma.redSocial.update({
            where: { id },
            data
        });
    }

    async eliminarRedSocial(id: string): Promise<RedSocial> {
        // Soft delete
        return this.prisma.redSocial.update({
            where: { id },
            data: { activo: false }
        });
    }

    // Metodos Donacion
    async listarMetodosDonacion(): Promise<MetodoDonacion[]> {
        return this.prisma.metodoDonacion.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' }
        });
    }

    async crearMetodoDonacion(data: { nombre: string; icono?: string }): Promise<MetodoDonacion> {
        return this.prisma.metodoDonacion.create({ data });
    }

    async actualizarMetodoDonacion(id: string, data: Partial<MetodoDonacion>): Promise<MetodoDonacion> {
        return this.prisma.metodoDonacion.update({
            where: { id },
            data
        });
    }

    async eliminarMetodoDonacion(id: string): Promise<MetodoDonacion> {
        // Soft delete
        return this.prisma.metodoDonacion.update({
            where: { id },
            data: { activo: false }
        });
    }

    // Roles
    async listarRoles(): Promise<Rol[]> {
        return this.prisma.rol.findMany({
            orderBy: { nombre: 'asc' }
        }).then(roles => roles.map(r => ({ id: r.id, nombre: r.nombre })));
    }
}
