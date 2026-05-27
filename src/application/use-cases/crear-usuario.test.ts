import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrearUsuarioCasoUso } from './crear-usuario';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';

describe('CrearUsuarioCasoUso', () => {
    let casoUso: CrearUsuarioCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarPorCorreo: vi.fn(),
            buscarPorNombreUsuario: vi.fn(),
            crear: vi.fn(),
            actualizar: vi.fn(),
        };

        casoUso = new CrearUsuarioCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    describe('ejecutar - usuario existente', () => {
        it('debe reactivar la cuenta si el estado es DESHABILITADO', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'DESHABILITADO',
                nombre: 'Juan',
                imagen: 'google.com/pic',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue({
                ...usuarioMock,
                estadoCuenta: 'ACTIVO',
                fechaEliminacionProgramada: null,
            });

            const result = await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan',
                imagen: 'google.com/pic',
            } as any);

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                estadoCuenta: 'ACTIVO',
                fechaEliminacionProgramada: null,
            });
            expect(result.estadoCuenta).toBe('ACTIVO');
        });

        it('debe reactivar la cuenta si el estado es ELIMINACION_PENDIENTE', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'ELIMINACION_PENDIENTE',
                nombre: 'Juan',
                imagen: 'google.com/pic',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan',
                imagen: 'google.com/pic',
            } as any);

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                estadoCuenta: 'ACTIVO',
                fechaEliminacionProgramada: null,
            });
        });

        it('debe actualizar el nombre si no existia', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'ACTIVO',
                nombre: null,
                imagen: 'google.com/pic',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan Carlos',
                imagen: 'google.com/pic',
            } as any);

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                nombre: 'Juan Carlos',
            });
        });

        it('debe actualizar la imagen si cambia', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'ACTIVO',
                nombre: 'Juan',
                imagen: 'old-pic.jpg',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan',
                imagen: 'new-pic.jpg',
            } as any);

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                imagen: 'new-pic.jpg',
            });
        });

        it('debe retornar el usuario existente sin actualizar si no hay cambios', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'ACTIVO',
                nombre: 'Juan',
                imagen: 'pic.jpg',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);

            const result = await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan',
                imagen: 'pic.jpg',
            } as any);

            expect(mockRepositorioUsuario.actualizar).not.toHaveBeenCalled();
            expect(result).toBe(usuarioMock);
        });
    });

    describe('ejecutar - usuario nuevo', () => {
        it('debe crear el usuario con el nombreUsuario proporcionado', async () => {
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);
            mockRepositorioUsuario.crear.mockResolvedValue({
                correo: 'new@test.com',
                nombreUsuario: 'user_defined',
            });

            const result = await casoUso.ejecutar({
                correo: 'new@test.com',
                nombreUsuario: 'user_defined',
            } as any);

            expect(mockRepositorioUsuario.crear).toHaveBeenCalledWith({
                correo: 'new@test.com',
                nombreUsuario: 'user_defined',
            });
            expect(result.nombreUsuario).toBe('user_defined');
        });

        it('debe autogenerar un nombreUsuario unico usando el nombre de pila si no se proporciona', async () => {
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(null);
            mockRepositorioUsuario.crear.mockResolvedValue({
                correo: 'new@test.com',
                nombreUsuario: 'juansanchez',
            });

            await casoUso.ejecutar({
                correo: 'new@test.com',
                nombre: 'Juan Sanchez',
            } as any);

            expect(mockRepositorioUsuario.buscarPorNombreUsuario).toHaveBeenCalledWith('juansanchez');
            expect(mockRepositorioUsuario.crear).toHaveBeenCalledWith({
                correo: 'new@test.com',
                nombre: 'Juan Sanchez',
                nombreUsuario: 'juansanchez',
            });
        });

        it('debe autogenerar un nombreUsuario unico usando el correo si nombre no se proporciona', async () => {
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(null);
            mockRepositorioUsuario.crear.mockResolvedValue({
                correo: 'sanchez.juan@test.com',
                nombreUsuario: 'sanchezjuan',
            });

            await casoUso.ejecutar({
                correo: 'sanchez.juan@test.com',
            } as any);

            expect(mockRepositorioUsuario.buscarPorNombreUsuario).toHaveBeenCalledWith('sanchezjuan');
            expect(mockRepositorioUsuario.crear).toHaveBeenCalledWith({
                correo: 'sanchez.juan@test.com',
                nombreUsuario: 'sanchezjuan',
            });
        });

        it('debe añadir un numero aleatorio y reintentar si el nombreUsuario ya esta en uso', async () => {
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);
            // Primero existe, luego ya no existe
            mockRepositorioUsuario.buscarPorNombreUsuario
                .mockResolvedValueOnce({ id: 'existing' })
                .mockResolvedValueOnce(null);

            mockRepositorioUsuario.crear.mockResolvedValue({
                correo: 'new@test.com',
                nombreUsuario: 'juan123',
            });

            await casoUso.ejecutar({
                correo: 'new@test.com',
                nombre: 'Juan',
            } as any);

            expect(mockRepositorioUsuario.buscarPorNombreUsuario).toHaveBeenCalledTimes(2);
            expect(mockRepositorioUsuario.crear).toHaveBeenCalledWith(expect.objectContaining({
                nombreUsuario: expect.stringMatching(/^juan\d+$/),
            }));
        });

        it('debe detenerse despues de 10 intentos fallidos de generar un nombreUsuario unico', async () => {
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);
            // Siempre existe
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue({ id: 'existing' });

            mockRepositorioUsuario.crear.mockResolvedValue({
                correo: 'new@test.com',
                nombreUsuario: 'juan-something',
            });

            await casoUso.ejecutar({
                correo: 'new@test.com',
                nombre: 'Juan',
            } as any);

            // 1 intento inicial de la base, más 9 intentos adicionales (total 10) antes de romper
            expect(mockRepositorioUsuario.buscarPorNombreUsuario).toHaveBeenCalledTimes(10);
            expect(mockRepositorioUsuario.crear).toHaveBeenCalled();
        });
    });
});
