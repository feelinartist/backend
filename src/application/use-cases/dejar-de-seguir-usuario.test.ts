import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DejarDeSeguirUsuarioCasoUso } from './dejar-de-seguir-usuario';
import { RepositorioSeguidor } from '../../domain/repositories/seguidor-repository';

describe('DejarDeSeguirUsuarioCasoUso', () => {
    let casoUso: DejarDeSeguirUsuarioCasoUso;
    let mockRepositorioSeguidor: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioSeguidor = {
            dejarDeSeguir: vi.fn(),
        };

        casoUso = new DejarDeSeguirUsuarioCasoUso(mockRepositorioSeguidor as unknown as RepositorioSeguidor);
    });

    it('debe llamar a dejarDeSeguir con los parametros correspondientes', async () => {
        mockRepositorioSeguidor.dejarDeSeguir.mockResolvedValue(undefined);

        await casoUso.ejecutar('u1', 'u2', 'ARTISTA');

        expect(mockRepositorioSeguidor.dejarDeSeguir).toHaveBeenCalledWith('u1', 'u2', 'ARTISTA');
    });
});
