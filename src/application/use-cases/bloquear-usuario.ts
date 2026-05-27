import { RepositorioUsuario } from "../../domain/repositories/user-repository";
import { Usuario } from "../../domain/entities/user";

export class BloquearUsuarioCasoUso {
    constructor(private repositorioUsuario: RepositorioUsuario) { }

    async bloquear(bloqueadorId: string, bloqueadoId: string): Promise<void> {
        if (bloqueadorId === bloqueadoId) {
            throw new Error("No puedes bloquearte a ti mismo");
        }
        const bloqueador = await this.repositorioUsuario.buscarPorId(bloqueadorId);
        const bloqueado = await this.repositorioUsuario.buscarPorId(bloqueadoId);

        if (!bloqueador || !bloqueado) {
            throw new Error("Usuario no encontrado");
        }

        await this.repositorioUsuario.bloquear(bloqueadorId, bloqueadoId);
    }

    async desbloquear(bloqueadorId: string, bloqueadoId: string): Promise<void> {
        await this.repositorioUsuario.desbloquear(bloqueadorId, bloqueadoId);
    }

    async obtenerBloqueados(bloqueadorId: string): Promise<Usuario[]> {
        return this.repositorioUsuario.obtenerBloqueados(bloqueadorId);
    }
}
