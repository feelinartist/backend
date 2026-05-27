import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GestionCuentaCasoUso } from './gestion-cuenta';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';

describe('GestionCuentaCasoUso', () => {
    let casoUso: GestionCuentaCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarPorId: vi.fn(),
            actualizar: vi.fn(),
            eliminarPermanente: vi.fn(),
        };

        casoUso = new GestionCuentaCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    describe('deshabilitarCuenta', () => {
        it('debe lanzar error si el usuario no existe', async () => {
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(null);
            await expect(casoUso.deshabilitarCuenta('123')).rejects.toThrow('Usuario no encontrado');
        });

        it('debe deshabilitar la cuenta exitosamente', async () => {
            const usuarioMock = { id: '123', estadoCuenta: 'ACTIVO' };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue({ ...usuarioMock, estadoCuenta: 'DESHABILITADO' });

            const result = await casoUso.deshabilitarCuenta('123');

            expect(mockRepositorioUsuario.buscarPorId).toHaveBeenCalledWith('123');
            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', { estadoCuenta: 'DESHABILITADO' });
            expect(result.estadoCuenta).toBe('DESHABILITADO');
        });
    });

    describe('programarEliminacion', () => {
        it('debe lanzar error si el usuario no existe', async () => {
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(null);
            await expect(casoUso.programarEliminacion('123')).rejects.toThrow('Usuario no encontrado');
        });

        it('debe programar la eliminacion exitosamente a los 30 dias', async () => {
            const usuarioMock = { id: '123', estadoCuenta: 'ACTIVO' };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.programarEliminacion('123');

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                estadoCuenta: 'ELIMINACION_PENDIENTE',
                fechaEliminacionProgramada: expect.any(Date),
            });
        });
    });

    describe('reactivarCuenta', () => {
        it('debe lanzar error si el usuario no existe', async () => {
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(null);
            await expect(casoUso.reactivarCuenta('123')).rejects.toThrow('Usuario no encontrado');
        });

        it('debe reactivar la cuenta exitosamente', async () => {
            const usuarioMock = { id: '123', estadoCuenta: 'DESHABILITADO' };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.reactivarCuenta('123');

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                estadoCuenta: 'ACTIVO',
                fechaEliminacionProgramada: null,
            });
        });
    });

    describe('banearUsuario', () => {
        it('debe lanzar error si el usuario no existe', async () => {
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(null);
            await expect(casoUso.banearUsuario('123')).rejects.toThrow('Usuario no encontrado');
        });

        it('debe banear al usuario exitosamente', async () => {
            const usuarioMock = { id: '123', estadoCuenta: 'ACTIVO' };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.banearUsuario('123');

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                estadoCuenta: 'BANEADO',
            });
        });
    });

    describe('eliminarUsuarioPermanente', () => {
        it('debe lanzar error si el usuario no existe', async () => {
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(null);
            await expect(casoUso.eliminarUsuarioPermanente('123')).rejects.toThrow('Usuario no encontrado');
        });

        it('debe eliminar permanentemente al usuario exitosamente', async () => {
            const usuarioMock = { id: '123' };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);

            await casoUso.eliminarUsuarioPermanente('123');

            expect(mockRepositorioUsuario.eliminarPermanente).toHaveBeenCalledWith('123');
        });
    });

    describe('ejecutar', () => {
        it('debe llamar a deshabilitarCuenta al enviar accion suspender', async () => {
            const spy = vi.spyOn(casoUso, 'deshabilitarCuenta').mockResolvedValue({} as any);

            await casoUso.ejecutar('123', 'suspender');

            expect(spy).toHaveBeenCalledWith('123');
        });

        it('debe llamar a reactivarCuenta al enviar accion activar', async () => {
            const spy = vi.spyOn(casoUso, 'reactivarCuenta').mockResolvedValue({} as any);

            await casoUso.ejecutar('123', 'activar');

            expect(spy).toHaveBeenCalledWith('123');
        });

        it('debe llamar a eliminarUsuarioPermanente al enviar accion eliminar', async () => {
            const spy = vi.spyOn(casoUso, 'eliminarUsuarioPermanente').mockResolvedValue();

            await casoUso.ejecutar('123', 'eliminar');

            expect(spy).toHaveBeenCalledWith('123');
        });

        it('no debe hacer nada si la accion no es soportada o es vacia', async () => {
            const spyDeshabilitar = vi.spyOn(casoUso, 'deshabilitarCuenta');
            const spyReactivar = vi.spyOn(casoUso, 'reactivarCuenta');
            const spyEliminar = vi.spyOn(casoUso, 'eliminarUsuarioPermanente');

            await casoUso.ejecutar('123', 'otra_cosa' as any);

            expect(spyDeshabilitar).not.toHaveBeenCalled();
            expect(spyReactivar).not.toHaveBeenCalled();
            expect(spyEliminar).not.toHaveBeenCalled();
        });
    });
});
