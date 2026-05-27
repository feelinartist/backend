import { RepositorioUsuario } from "../../domain/repositories/user-repository";
import { Usuario } from "../../domain/entities/user";

export class MigrarRolUsuarioCasoUso {
    constructor(private repositorioUsuario: RepositorioUsuario) { }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async ejecutar(usuarioId: string, nuevoRol: string, datosPerfil: any): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario) {
            throw new Error("Usuario no encontrado");
        }

        if (usuario.rol?.nombre === nuevoRol) {
            throw new Error("El usuario ya tiene este rol");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const datosActualizacion: any = {
            rol: nuevoRol
        };

        // Validate and prepare data based on new role
        if (nuevoRol === 'ARTISTA') {
            // Check if profile exists or if data is provided
            if (!usuario.perfilArtista && (!datosPerfil.nombreArtistico || !datosPerfil.categoria || !datosPerfil.ciudad || !datosPerfil.pais)) {
                throw new Error("Faltan datos requeridos para el perfil de Artista (nombreArtistico, categoria, ciudad, pais)");
            }

            // Map nombreArtistico to Usuario.nombre
            if (datosPerfil.nombreArtistico) {
                datosActualizacion.nombre = datosPerfil.nombreArtistico;
                delete datosPerfil.nombreArtistico;
            }

            datosActualizacion.perfilArtista = {
                usuarioId,
                ...datosPerfil
            };
        } else if (nuevoRol === 'DISCOTECA') {
            if (!usuario.perfilDiscoteca && (!datosPerfil.nombre || !datosPerfil.ciudad || !datosPerfil.pais)) {
                throw new Error("Faltan datos requeridos para el perfil de Discoteca (nombre, ciudad, pais)");
            }

            // Map nombre to Usuario.nombre
            if (datosPerfil.nombre) {
                datosActualizacion.nombre = datosPerfil.nombre;
                delete datosPerfil.nombre;
            }

            datosActualizacion.perfilDiscoteca = {
                usuarioId,
                ...datosPerfil
            };
        } else if (nuevoRol === 'PUBLICO') {
            if (!usuario.perfilPublico && (!datosPerfil.ciudad || !datosPerfil.pais)) {
                throw new Error("Faltan datos requeridos para el perfil Público (ciudad, pais)");
            }

            // Map nombreCompleto to Usuario.nombre if provided (though usually Public profile uses existing name)
            if (datosPerfil.nombreCompleto) {
                datosActualizacion.nombre = datosPerfil.nombreCompleto;
                delete datosPerfil.nombreCompleto;
            }

            datosActualizacion.perfilPublico = {
                usuarioId,
                ...datosPerfil
            };
        } else {
            throw new Error("Rol no válido para migración");
        }

        return this.repositorioUsuario.actualizar(usuarioId, datosActualizacion);
    }
}
