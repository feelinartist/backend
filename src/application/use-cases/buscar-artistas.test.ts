import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuscarArtistasCasoUso } from './buscar-artistas';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';

describe('BuscarArtistasCasoUso', () => {
    let casoUso: BuscarArtistasCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarArtistas: vi.fn(),
        };

        casoUso = new BuscarArtistasCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    it('debe llamar a buscarArtistas con el filtro correcto y retornar el resultado', async () => {
        const resultadoMock = [{ id: 'a1', nombre: 'Artista' }];
        mockRepositorioUsuario.buscarArtistas.mockResolvedValue(resultadoMock);

        const filtro = { termino: 'metal', paisId: 'PE', usuarioSolicitanteId: 'u1' };
        const result = await casoUso.ejecutar(filtro);

        expect(mockRepositorioUsuario.buscarArtistas).toHaveBeenCalledWith(filtro);
        expect(result).toBe(resultadoMock);
    });
});
