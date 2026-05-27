import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeguirUsuarioCasoUso } from './seguir-usuario';
import { RepositorioSeguidor } from '../../domain/repositories/seguidor-repository';

describe('SeguirUsuarioCasoUso', () => {
    let casoUso: SeguirUsuarioCasoUso;
    let mockRepositorioSeguidor: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioSeguidor = {
            esSeguidor: vi.fn(),
            seguir: vi.fn(),
        };

        casoUso = new SeguirUsuarioCasoUso(mockRepositorioSeguidor as unknown as RepositorioSeguidor);
    });

    it('debe lanzar error si el seguidor ya sigue al usuario objetivo', async () => {
        mockRepositorioSeguidor.esSeguidor.mockResolvedValue(true);

        await expect(casoUso.ejecutar('u1', 'u2', 'ARTISTA'))
            .rejects.toThrow('Ya sigues a este usuario');

        expect(mockRepositorioSeguidor.esSeguidor).toHaveBeenCalledWith('u1', 'u2', 'ARTISTA');
        expect(mockRepositorioSeguidor.seguir).not.toHaveBeenCalled();
    });

    it('debe llamar a seguir si el seguidor no sigue al usuario objetivo', async () => {
        mockRepositorioSeguidor.esSeguidor.mockResolvedValue(false);
        mockRepositorioSeguidor.seguir.mockResolvedValue(undefined);

        await casoUso.ejecutar('u1', 'u2', 'DISCOTECA');

        expect(mockRepositorioSeguidor.esSeguidor).toHaveBeenCalledWith('u1', 'u2', 'DISCOTECA');
        expect(mockRepositorioSeguidor.seguir).toHaveBeenCalledWith('u1', 'u2', 'DISCOTECA');
    });
});
