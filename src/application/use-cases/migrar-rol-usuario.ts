import { RepositorioUsuario } from "../../domain/repositories/user-repository";
import { Usuario } from "../../domain/entities/user";

export class MigrarRolUsuarioCasoUso {
    constructor(private readonly repositorioUsuario: RepositorioUsuario) { }

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
            this.validateAndPrepareArtistMigration(datosPerfil, datosActualizacion, usuario, usuarioId);
        } else if (nuevoRol === 'DISCOTECA') {
            this.validateAndPrepareDiscotecaMigration(datosPerfil, datosActualizacion, usuario, usuarioId);
        } else if (nuevoRol === 'PUBLICO') {
            this.validateAndPreparePublicoMigration(datosPerfil, datosActualizacion, usuario, usuarioId);
        } else {
            throw new Error("Rol no válido para migración");
        }

        return this.repositorioUsuario.actualizar(usuarioId, datosActualizacion);
    }

    private validateAndPrepareArtistMigration(datosPerfil: any, datosActualizacion: any, usuario: Usuario, usuarioId: string): void {
        if (!usuario.perfilArtista && (!datosPerfil?.nombreArtistico || !datosPerfil?.categoria || !datosPerfil?.ciudad || !datosPerfil?.pais)) {
            throw new Error("Faltan datos requeridos para el perfil de Artista (nombreArtistico, categoria, ciudad, pais)");
        }

        if (datosPerfil?.nombreArtistico) {
            datosActualizacion.nombre = datosPerfil.nombreArtistico;
            delete datosPerfil.nombreArtistico;
        }

        datosActualizacion.perfilArtista = {
            usuarioId,
            ...datosPerfil
        };
    }

    private validateAndPrepareDiscotecaMigration(datosPerfil: any, datosActualizacion: any, usuario: Usuario, usuarioId: string): void {
        if (!usuario.perfilDiscoteca && (!datosPerfil?.nombre || !datosPerfil?.ciudad || !datosPerfil?.pais)) {
            throw new Error("Faltan datos requeridos para el perfil de Discoteca (nombre, ciudad, pais)");
        }

        if (datosPerfil?.nombre) {
            datosActualizacion.nombre = datosPerfil.nombre;
            delete datosPerfil.nombre;
        }

        datosActualizacion.perfilDiscoteca = {
            usuarioId,
            ...datosPerfil
        };
    }

    private validateAndPreparePublicoMigration(datosPerfil: any, datosActualizacion: any, usuario: Usuario, usuarioId: string): void {
        if (!usuario.perfilPublico && (!datosPerfil?.ciudad || !datosPerfil?.pais)) {
            throw new Error("Faltan datos requeridos para el perfil Público (ciudad, pais)");
        }

        if (datosPerfil?.nombreCompleto) {
            datosActualizacion.nombre = datosPerfil.nombreCompleto;
            delete datosPerfil.nombreCompleto;
        }

        datosActualizacion.perfilPublico = {
            usuarioId,
            ...datosPerfil
        };
    }
}
