import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BloquearUsuarioCasoUso } from './bloquear-usuario';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';

describe('BloquearUsuarioCasoUso', () => {
    let casoUso: BloquearUsuarioCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarPorId: vi.fn(),
            bloquear: vi.fn(),
            desbloquear: vi.fn(),
            obtenerBloqueados: vi.fn(),
        };

        casoUso = new BloquearUsuarioCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    describe('bloquear', () => {
        it('debe lanzar error si el bloqueador y el bloqueado son el mismo usuario', async () => {
            await expect(casoUso.bloquear('u1', 'u1'))
                .rejects.toThrow('No puedes bloquearte a ti mismo');

            expect(mockRepositorioUsuario.buscarPorId).not.toHaveBeenCalled();
            expect(mockRepositorioUsuario.bloquear).not.toHaveBeenCalled();
        });

        it('debe lanzar error si el bloqueador no existe', async () => {
            mockRepositorioUsuario.buscarPorId.mockImplementation((id: string) => {
                if (id === 'u1') return Promise.resolve(null);
                return Promise.resolve({ id: 'u2' });
            });

            await expect(casoUso.bloquear('u1', 'u2'))
                .rejects.toThrow('Usuario no encontrado');
        });

        it('debe lanzar error si el bloqueado no existe', async () => {
            mockRepositorioUsuario.buscarPorId.mockImplementation((id: string) => {
                if (id === 'u1') return Promise.resolve({ id: 'u1' });
                return Promise.resolve(null);
            });

            await expect(casoUso.bloquear('u1', 'u2'))
                .rejects.toThrow('Usuario no encontrado');
        });

        it('debe bloquear al usuario exitosamente si ambos existen', async () => {
            mockRepositorioUsuario.buscarPorId.mockImplementation((id: string) => {
                return Promise.resolve({ id });
            });
            mockRepositorioUsuario.bloquear.mockResolvedValue(undefined);

            await casoUso.bloquear('u1', 'u2');

            expect(mockRepositorioUsuario.buscarPorId).toHaveBeenCalledWith('u1');
            expect(mockRepositorioUsuario.buscarPorId).toHaveBeenCalledWith('u2');
            expect(mockRepositorioUsuario.bloquear).toHaveBeenCalledWith('u1', 'u2');
        });
    });

    describe('desbloquear', () => {
        it('debe desbloquear al usuario exitosamente', async () => {
            mockRepositorioUsuario.desbloquear.mockResolvedValue(undefined);

            await casoUso.desbloquear('u1', 'u2');

            expect(mockRepositorioUsuario.desbloquear).toHaveBeenCalledWith('u1', 'u2');
        });
    });

    describe('obtenerBloqueados', () => {
        it('debe retornar la lista de usuarios bloqueados', async () => {
            const listaMock = [{ id: 'u2', nombre: 'Bloqueado' }];
            mockRepositorioUsuario.obtenerBloqueados.mockResolvedValue(listaMock);

            const result = await casoUso.obtenerBloqueados('u1');

            expect(mockRepositorioUsuario.obtenerBloqueados).toHaveBeenCalledWith('u1');
            expect(result).toBe(listaMock);
        });
    });
});
