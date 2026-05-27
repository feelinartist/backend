import { RepositorioSeguidor } from "../../domain/repositories/seguidor-repository";

export class SeguirUsuarioCasoUso {
    constructor(private repositorioSeguidor: RepositorioSeguidor) { }

    async ejecutar(seguidorId: string, seguidoId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<void> {
        // Here we could add logic to check if already following, but repository handles creation.
        // We could also check for blocks here if we had the user repository injected.
        // For now, let's assume the controller or repository checks for existence.
        // The repository implementation checks if the target profile exists.

        // Check if already following to avoid duplicates or errors?
        // Prisma create might fail if we don't handle uniqueness. 
        // Schema doesn't seem to have a unique constraint on (seguidorId, artistaSeguidoId) explicitly shown in the snippet, 
        // but it's good practice.

        const yaSigue = await this.repositorioSeguidor.esSeguidor(seguidorId, seguidoId, tipo);
        if (yaSigue) {
            throw new Error("Ya sigues a este usuario");
        }

        return this.repositorioSeguidor.seguir(seguidorId, seguidoId, tipo);
    }
}
