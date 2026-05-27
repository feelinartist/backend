import { RepositorioUsuario } from "../../domain/repositories/user-repository";
import { Usuario } from "../../domain/entities/user";

export class BuscarArtistasCasoUso {
    constructor(private readonly repositorioUsuario: RepositorioUsuario) { }

    async ejecutar(filtro: { termino?: string; paisId?: string; usuarioSolicitanteId?: string }): Promise<Usuario[]> {
        return this.repositorioUsuario.buscarArtistas(filtro);
    }
}
