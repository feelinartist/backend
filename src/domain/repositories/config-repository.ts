import { RedSocial, MetodoDonacion } from '@prisma/client';
import { Rol } from '../entities/user';

export interface RepositorioConfig {
    // Redes Sociales
    listarRedesSociales(): Promise<RedSocial[]>;
    crearRedSocial(data: { nombre: string; urlBase: string; icono?: string }): Promise<RedSocial>;
    actualizarRedSocial(id: string, data: Partial<RedSocial>): Promise<RedSocial>;
    eliminarRedSocial(id: string): Promise<RedSocial>;

    // Metodos Donacion
    listarMetodosDonacion(): Promise<MetodoDonacion[]>;
    crearMetodoDonacion(data: { nombre: string }): Promise<MetodoDonacion>;
    actualizarMetodoDonacion(id: string, data: Partial<MetodoDonacion>): Promise<MetodoDonacion>;
    eliminarMetodoDonacion(id: string): Promise<MetodoDonacion>;

    // Roles
    listarRoles(): Promise<Rol[]>;
}
