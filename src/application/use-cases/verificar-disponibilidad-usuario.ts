import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import crypto from 'node:crypto';

export class VerificarDisponibilidadUsuarioCasoUso {
    constructor(private readonly repositorioUsuario: RepositorioUsuario) { }

    async ejecutar(nombreUsuario: string): Promise<{ disponible: boolean; sugerencias: string[] }> {
        const usuarioExistente = await this.repositorioUsuario.buscarPorNombreUsuario(nombreUsuario);

        if (!usuarioExistente) {
            return { disponible: true, sugerencias: [] };
        }

        const sugerencias: string[] = [];
        const nombreBase = nombreUsuario.toLowerCase().replace(/[^a-z0-9_]/g, '');

        // 1. Try preferred patterns first
        const patronesPreferidos = [
            `${nombreBase}_oficial`,
            `${nombreBase}_pe`,
            `soy_${nombreBase}`,
            `${nombreBase}_music`,
            `${nombreBase}_dj`
        ];

        for (const candidato of patronesPreferidos) {
            if (sugerencias.length >= 3) break;
            const usuario = await this.repositorioUsuario.buscarPorNombreUsuario(candidato);
            if (!usuario) {
                sugerencias.push(candidato);
            }
        }

        // 2. Fill remaining slots with random number suffixes (guaranteed to find available ones)
        let intentos = 0;
        while (sugerencias.length < 3 && intentos < 20) {
            const randomNum = crypto.randomInt(0, 10000);
            // Format: name_1234 (requested format: random number with underscore)
            const candidato = `${nombreBase}_${randomNum}`;

            if (!sugerencias.includes(candidato)) {
                const usuario = await this.repositorioUsuario.buscarPorNombreUsuario(candidato);
                if (!usuario) {
                    sugerencias.push(candidato);
                }
            }
            intentos++;
        }

        return { disponible: false, sugerencias };
    }
}
