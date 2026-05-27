import { RepositorioUsuario } from "../../domain/repositories/user-repository";
import { Usuario } from "../../domain/entities/user";

export class GestionCuentaCasoUso {
    constructor(private repositorioUsuario: RepositorioUsuario) { }

    async deshabilitarCuenta(usuarioId: string): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario) throw new Error("Usuario no encontrado");

        return this.repositorioUsuario.actualizar(usuarioId, {
            estadoCuenta: 'DESHABILITADO'
        });
    }

    async programarEliminacion(usuarioId: string): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario) throw new Error("Usuario no encontrado");

        const fechaEliminacion = new Date();
        fechaEliminacion.setDate(fechaEliminacion.getDate() + 30);

        return this.repositorioUsuario.actualizar(usuarioId, {
            estadoCuenta: 'ELIMINACION_PENDIENTE',
            fechaEliminacionProgramada: fechaEliminacion
        });
    }

    async reactivarCuenta(usuarioId: string): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario) throw new Error("Usuario no encontrado");

        return this.repositorioUsuario.actualizar(usuarioId, {
            estadoCuenta: 'ACTIVO',
            fechaEliminacionProgramada: null
        });
    }

    async banearUsuario(usuarioId: string): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario) throw new Error("Usuario no encontrado");

        return this.repositorioUsuario.actualizar(usuarioId, {
            estadoCuenta: 'BANEADO'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any); // Type cast due to possible enum lag in generated types
    }

    async ejecutar(usuarioId: string, _accion: 'suspender' | 'activar' | 'eliminar', _motivo?: string): Promise<void> {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario) throw new Error("Usuario no encontrado");

        await this.repositorioUsuario.eliminarPermanente(usuarioId);
    }

    async eliminarUsuarioPermanente(usuarioId: string): Promise<void> {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario) throw new Error("Usuario no encontrado");

        await this.repositorioUsuario.eliminarPermanente(usuarioId);
    }
}
