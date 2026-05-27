import { RepositorioSeguidor } from "../../domain/repositories/seguidor-repository";

export class DejarDeSeguirUsuarioCasoUso {
    constructor(private readonly repositorioSeguidor: RepositorioSeguidor) { }

    async ejecutar(seguidorId: string, seguidoId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<void> {
        return this.repositorioSeguidor.dejarDeSeguir(seguidorId, seguidoId, tipo);
    }
}
