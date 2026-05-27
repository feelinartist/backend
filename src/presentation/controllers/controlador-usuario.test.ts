import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock target modules using dynamic globalThis functions to bypass vi.mock hoisting and module-level instantiation issues
vi.mock('../../infrastructure/repositories/prisma-user-repository', () => {
    return {
        RepositorioUsuarioPrisma: class MockRepositorioUsuarioPrisma {
            listarUsuarios = (...args: any[]) => (globalThis as any).mockListarUsuarios(...args);
            buscarPorId = (...args: any[]) => (globalThis as any).mockBuscarPorId(...args);
            buscarPorNombreUsuario = (...args: any[]) => (globalThis as any).mockBuscarPorNombreUsuario(...args);
            actualizar = (...args: any[]) => (globalThis as any).mockActualizar(...args);
            obtenerPaises = (...args: any[]) => (globalThis as any).mockObtenerPaises(...args);
            obtenerCiudades = (...args: any[]) => (globalThis as any).mockObtenerCiudades(...args);
        }
    };
});

vi.mock('../../application/use-cases/actualizar-rol-usuario', () => {
    return {
        ActualizarRolUsuarioCasoUso: class MockActualizarRolUsuarioCasoUso {
            ejecutar = (...args: any[]) => (globalThis as any).mockActualizarRolUsuario(...args);
        }
    };
});

vi.mock('../../application/use-cases/verificar-disponibilidad-usuario', () => {
    return {
        VerificarDisponibilidadUsuarioCasoUso: class MockVerificarDisponibilidadUsuarioCasoUso {
            ejecutar = (...args: any[]) => (globalThis as any).mockVerificarDisponibilidad(...args);
        }
    };
});

vi.mock('../../application/use-cases/actualizar-usuario', () => {
    return {
        ActualizarUsuarioCasoUso: class MockActualizarUsuarioCasoUso {
            ejecutar = (...args: any[]) => (globalThis as any).mockActualizarUsuario(...args);
        }
    };
});

vi.mock('../../application/use-cases/gestion-cuenta', () => {
    return {
        GestionCuentaCasoUso: class MockGestionCuentaCasoUso {
            deshabilitarCuenta = (...args: any[]) => (globalThis as any).mockDeshabilitarCuenta(...args);
            programarEliminacion = (...args: any[]) => (globalThis as any).mockProgramarEliminacion(...args);
            reactivarCuenta = (...args: any[]) => (globalThis as any).mockReactivarCuenta(...args);
            banearUsuario = (...args: any[]) => (globalThis as any).mockBanearUsuario(...args);
            eliminarUsuarioPermanente = (...args: any[]) => (globalThis as any).mockEliminarUsuarioPermanente(...args);
        }
    };
});

vi.mock('../../application/use-cases/bloquear-usuario', () => {
    return {
        BloquearUsuarioCasoUso: class MockBloquearUsuarioCasoUso {
            bloquear = (...args: any[]) => (globalThis as any).mockBloquear(...args);
            desbloquear = (...args: any[]) => (globalThis as any).mockDesbloquear(...args);
            obtenerBloqueados = (...args: any[]) => (globalThis as any).mockObtenerBloqueados(...args);
        }
    };
});

vi.mock('../../application/use-cases/buscar-artistas', () => {
    return {
        BuscarArtistasCasoUso: class MockBuscarArtistasCasoUso {
            ejecutar = (...args: any[]) => (globalThis as any).mockBuscarArtistas(...args);
        }
    };
});

vi.mock('../../application/use-cases/migrar-rol-usuario', () => {
    return {
        MigrarRolUsuarioCasoUso: class MockMigrarRolUsuarioCasoUso {
            ejecutar = (...args: any[]) => (globalThis as any).mockMigrarRol(...args);
        }
    };
});

vi.mock('../../middleware/auth', () => {
    return {
        generateToken: (...args: any[]) => (globalThis as any).mockGenerateToken(...args)
    };
});

// Assign actual spy functions to globalThis
(globalThis as any).mockListarUsuarios = vi.fn();
(globalThis as any).mockBuscarPorId = vi.fn();
(globalThis as any).mockBuscarPorNombreUsuario = vi.fn();
(globalThis as any).mockActualizar = vi.fn();
(globalThis as any).mockObtenerPaises = vi.fn();
(globalThis as any).mockObtenerCiudades = vi.fn();
(globalThis as any).mockActualizarRolUsuario = vi.fn();
(globalThis as any).mockVerificarDisponibilidad = vi.fn();
(globalThis as any).mockActualizarUsuario = vi.fn();
(globalThis as any).mockDeshabilitarCuenta = vi.fn();
(globalThis as any).mockProgramarEliminacion = vi.fn();
(globalThis as any).mockReactivarCuenta = vi.fn();
(globalThis as any).mockBanearUsuario = vi.fn();
(globalThis as any).mockEliminarUsuarioPermanente = vi.fn();
(globalThis as any).mockBloquear = vi.fn();
(globalThis as any).mockDesbloquear = vi.fn();
(globalThis as any).mockObtenerBloqueados = vi.fn();
(globalThis as any).mockBuscarArtistas = vi.fn();
(globalThis as any).mockMigrarRol = vi.fn();
(globalThis as any).mockGenerateToken = vi.fn().mockReturnValue('mock-jwt-token');

import { ControladorUsuario } from './controlador-usuario';
import prisma from '../../infrastructure/database/prisma';

describe('ControladorUsuario', () => {
    let controller: ControladorUsuario;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorUsuario();
        
        jsonMock = vi.fn();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: statusMock,
            json: jsonMock
        };
    });

    describe('listarUsuarios', () => {
        it('should list users with parsed page/limit', async () => {
            req.query = { page: '2', limit: '5', termino: 'test' };
            const mockResult = { usuarios: [], total: 0 };
            (globalThis as any).mockListarUsuarios.mockResolvedValue(mockResult);

            await controller.listarUsuarios(req as Request, res as Response);

            expect((globalThis as any).mockListarUsuarios).toHaveBeenCalledWith(2, 5, 'test');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockResult);
        });

        it('should return 500 on repository error', async () => {
            req.query = {};
            (globalThis as any).mockListarUsuarios.mockRejectedValue(new Error('DB Error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.listarUsuarios(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('deshabilitarCuenta', () => {
        it('should return 400 if usuarioId is missing', async () => {
            req.body = {};
            await controller.deshabilitarCuenta(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should call use case and return success', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockDeshabilitarCuenta.mockResolvedValue({ id: 'user-1', status: 'DESHABILITADO' });

            await controller.deshabilitarCuenta(req as Request, res as Response);

            expect((globalThis as any).mockDeshabilitarCuenta).toHaveBeenCalledWith('user-1');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockDeshabilitarCuenta.mockRejectedValue(new Error('Error'));
            await controller.deshabilitarCuenta(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('eliminarCuenta', () => {
        it('should return 400 if usuarioId is missing', async () => {
            req.body = {};
            await controller.eliminarCuenta(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should call programarEliminacion and return success', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockProgramarEliminacion.mockResolvedValue({ id: 'user-1' });

            await controller.eliminarCuenta(req as Request, res as Response);

            expect((globalThis as any).mockProgramarEliminacion).toHaveBeenCalledWith('user-1');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockProgramarEliminacion.mockRejectedValue(new Error('Error'));
            await controller.eliminarCuenta(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('reactivarCuenta', () => {
        it('should return 400 if usuarioId is missing', async () => {
            req.body = {};
            await controller.reactivarCuenta(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should call reactivarCuenta and return success', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockReactivarCuenta.mockResolvedValue({ id: 'user-1' });

            await controller.reactivarCuenta(req as Request, res as Response);

            expect((globalThis as any).mockReactivarCuenta).toHaveBeenCalledWith('user-1');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockReactivarCuenta.mockRejectedValue(new Error('Error'));
            await controller.reactivarCuenta(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('banearUsuario', () => {
        it('should return 400 if usuarioId is missing', async () => {
            req.body = {};
            await controller.banearUsuario(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should call banearUsuario and return success', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockBanearUsuario.mockResolvedValue({ id: 'user-1' });

            await controller.banearUsuario(req as Request, res as Response);

            expect((globalThis as any).mockBanearUsuario).toHaveBeenCalledWith('user-1');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockBanearUsuario.mockRejectedValue(new Error('Error'));
            await controller.banearUsuario(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('eliminarPermanente', () => {
        it('should return 400 if usuarioId is missing', async () => {
            req.body = {};
            await controller.eliminarPermanente(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should call eliminarUsuarioPermanente and return success', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockEliminarUsuarioPermanente.mockResolvedValue(undefined);

            await controller.eliminarPermanente(req as Request, res as Response);

            expect((globalThis as any).mockEliminarUsuarioPermanente).toHaveBeenCalledWith('user-1');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockEliminarUsuarioPermanente.mockRejectedValue(new Error('Error'));
            await controller.eliminarPermanente(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('bloquearUsuario', () => {
        it('should return 400 if IDs are missing', async () => {
            req.body = { bloqueadorId: '', bloqueadoId: '' };
            await controller.bloquearUsuario(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should block user successfully', async () => {
            req.body = { bloqueadorId: 'b1', bloqueadoId: 'b2' };
            (globalThis as any).mockBloquear.mockResolvedValue(undefined);

            await controller.bloquearUsuario(req as Request, res as Response);

            expect((globalThis as any).mockBloquear).toHaveBeenCalledWith('b1', 'b2');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 with custom message on error', async () => {
            req.body = { bloqueadorId: 'b1', bloqueadoId: 'b2' };
            (globalThis as any).mockBloquear.mockRejectedValue(new Error('Custom error message'));

            await controller.bloquearUsuario(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Custom error message' });
        });
    });

    describe('desbloquearUsuario', () => {
        it('should return 400 if IDs are missing', async () => {
            req.body = {};
            await controller.desbloquearUsuario(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should unlock user successfully', async () => {
            req.body = { bloqueadorId: 'b1', bloqueadoId: 'b2' };
            (globalThis as any).mockDesbloquear.mockResolvedValue(undefined);

            await controller.desbloquearUsuario(req as Request, res as Response);

            expect((globalThis as any).mockDesbloquear).toHaveBeenCalledWith('b1', 'b2');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.body = { bloqueadorId: 'b1', bloqueadoId: 'b2' };
            (globalThis as any).mockDesbloquear.mockRejectedValue(new Error('Error'));
            await controller.desbloquearUsuario(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerBloqueados', () => {
        it('should return 400 if id is missing', async () => {
            req.params = {};
            await controller.obtenerBloqueados(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return list of blocked users', async () => {
            req.params = { bloqueadorId: 'b1' };
            (globalThis as any).mockObtenerBloqueados.mockResolvedValue([]);

            await controller.obtenerBloqueados(req as Request, res as Response);

            expect((globalThis as any).mockObtenerBloqueados).toHaveBeenCalledWith('b1');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.params = { bloqueadorId: 'b1' };
            (globalThis as any).mockObtenerBloqueados.mockRejectedValue(new Error('Error'));
            await controller.obtenerBloqueados(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('buscarArtistas', () => {
        it('should search artists with query parameters', async () => {
            req.query = { termino: 'jazz', paisId: 'PE', usuarioSolicitanteId: 'user-1' };
            (globalThis as any).mockBuscarArtistas.mockResolvedValue([]);

            await controller.buscarArtistas(req as Request, res as Response);

            expect((globalThis as any).mockBuscarArtistas).toHaveBeenCalledWith({
                termino: 'jazz',
                paisId: 'PE',
                usuarioSolicitanteId: 'user-1'
            });
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.query = {};
            (globalThis as any).mockBuscarArtistas.mockRejectedValue(new Error('Error'));
            await controller.buscarArtistas(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('migrarRol', () => {
        it('should return 400 if user or role is missing', async () => {
            req.body = {};
            await controller.migrarRol(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should migrate successfully', async () => {
            req.body = { usuarioId: 'user-1', nuevoRol: 'ARTISTA', datosPerfil: { bio: 'hello' } };
            (globalThis as any).mockMigrarRol.mockResolvedValue({ id: 'user-1' });

            await controller.migrarRol(req as Request, res as Response);

            expect((globalThis as any).mockMigrarRol).toHaveBeenCalledWith('user-1', 'ARTISTA', { bio: 'hello' });
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 400 on error', async () => {
            req.body = { usuarioId: 'user-1', nuevoRol: 'ARTISTA' };
            (globalThis as any).mockMigrarRol.mockRejectedValue(new Error('Migration failed'));

            await controller.migrarRol(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Migration failed' });
        });
    });

    describe('actualizarRol', () => {
        it('should return 400 if email or role is missing', async () => {
            req.body = {};
            await controller.actualizarRol(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should update role to ARTISTA, parse data and return token', async () => {
            req.body = {
                correo: 'test@correo.com',
                rol: 'ARTISTA',
                nombreUsuario: 'artistuser',
                nombreArtistico: 'Artist Name',
                ciudadId: 'city-1',
                paisId: 'PE',
                bio: 'Bio info'
            };
            const mockUser = { id: 'user-1', correo: 'test@correo.com', rol: { nombre: 'ARTISTA' } };
            (globalThis as any).mockActualizarRolUsuario.mockResolvedValue(mockUser);

            await controller.actualizarRol(req as Request, res as Response);

            expect((globalThis as any).mockActualizarRolUsuario).toHaveBeenCalledWith(
                'test@correo.com',
                'ARTISTA',
                { bio: 'Bio info', ciudad: 'city-1', pais: 'PE', nombreUsuario: 'artistuser' },
                undefined,
                undefined,
                'artistuser',
                'Artist Name'
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ ...mockUser, token: 'mock-jwt-token' });
        });

        it('should update role to PUBLICO', async () => {
            req.body = {
                correo: 'test@correo.com',
                rol: 'PUBLICO',
                nombreUsuario: 'pubuser',
                nombre: 'Public User',
                ciudad: 'city-1'
            };
            (globalThis as any).mockActualizarRolUsuario.mockResolvedValue({ id: 'user-1' });

            await controller.actualizarRol(req as Request, res as Response);

            expect((globalThis as any).mockActualizarRolUsuario).toHaveBeenCalledWith(
                'test@correo.com',
                'PUBLICO',
                undefined,
                { ciudad: 'city-1', nombreUsuario: 'pubuser' },
                undefined,
                'pubuser',
                'Public User'
            );
        });

        it('should update role to DISCOTECA', async () => {
            req.body = {
                correo: 'test@correo.com',
                rol: 'DISCOTECA',
                nombreUsuario: 'discouser',
                nombre: 'Disco Club',
                ciudadId: 'city-1',
                paisId: 'PE',
                fechaFundacion: '2020-01-01',
                codigoTelefono: '+51',
                numeroTelefono: '999999999',
                zonaHoraria: 'America/Lima'
            };
            (globalThis as any).mockActualizarRolUsuario.mockResolvedValue({ id: 'user-1' });

            await controller.actualizarRol(req as Request, res as Response);

            expect((globalThis as any).mockActualizarRolUsuario).toHaveBeenCalledWith(
                'test@correo.com',
                'DISCOTECA',
                undefined,
                undefined,
                {
                    ciudad: 'city-1',
                    pais: 'PE',
                    fechaFundacion: '2020-01-01',
                    codigoTelefono: '+51',
                    numeroTelefono: '999999999',
                    zonaHoraria: 'America/Lima'
                },
                'discouser',
                'Disco Club'
            );
        });

        it('should return 500 on error', async () => {
            req.body = { correo: 'test@correo.com', rol: 'ARTISTA' };
            (globalThis as any).mockActualizarRolUsuario.mockRejectedValue(new Error('Error'));
            await controller.actualizarRol(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('verificarNombreUsuario', () => {
        it('should return 400 if username is missing', async () => {
            req.body = {};
            await controller.verificarNombreUsuario(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should call use case and return availability', async () => {
            req.body = { nombreUsuario: 'testuser' };
            (globalThis as any).mockVerificarDisponibilidad.mockResolvedValue({ disponible: true });

            await controller.verificarNombreUsuario(req as Request, res as Response);

            expect((globalThis as any).mockVerificarDisponibilidad).toHaveBeenCalledWith('testuser');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.body = { nombreUsuario: 'testuser' };
            (globalThis as any).mockVerificarDisponibilidad.mockRejectedValue(new Error('Error'));
            await controller.verificarNombreUsuario(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('actualizarPerfil', () => {
        it('should return 400 if id is missing', async () => {
            req.body = {};
            await controller.actualizarPerfil(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should update profile and return user', async () => {
            req.body = { usuarioId: 'user-1', nombre: 'New Name' };
            (globalThis as any).mockActualizarUsuario.mockResolvedValue({ id: 'user-1', nombre: 'New Name' });

            await controller.actualizarPerfil(req as Request, res as Response);

            expect((globalThis as any).mockActualizarUsuario).toHaveBeenCalledWith(
                expect.objectContaining({ usuarioId: 'user-1', nombre: 'New Name' })
            );
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 400 with custom message on specific validation error', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockActualizarUsuario.mockRejectedValue(new Error('Debes esperar 30 días'));

            await controller.actualizarPerfil(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Debes esperar 30 días' });
        });

        it('should return 500 on other errors', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockActualizarUsuario.mockRejectedValue(new Error('Unexpected error'));

            await controller.actualizarPerfil(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerPerfil', () => {
        it('should return 400 if id is missing', async () => {
            req.params = {};
            await controller.obtenerPerfil(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return profile of existing user', async () => {
            req.params = { usuarioId: 'user-1' };
            (globalThis as any).mockBuscarPorId.mockResolvedValue({ id: 'user-1' });

            await controller.obtenerPerfil(req as Request, res as Response);

            expect((globalThis as any).mockBuscarPorId).toHaveBeenCalledWith('user-1');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 404 if user not found', async () => {
            req.params = { usuarioId: 'user-1' };
            (globalThis as any).mockBuscarPorId.mockResolvedValue(null);

            await controller.obtenerPerfil(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });

        it('should return 500 on error', async () => {
            req.params = { usuarioId: 'user-1' };
            (globalThis as any).mockBuscarPorId.mockRejectedValue(new Error('Error'));
            await controller.obtenerPerfil(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerPaises', () => {
        it('should return countries list', async () => {
            (globalThis as any).mockObtenerPaises.mockResolvedValue([]);
            await controller.obtenerPaises(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            (globalThis as any).mockObtenerPaises.mockRejectedValue(new Error('Error'));
            await controller.obtenerPaises(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerCiudades', () => {
        it('should return 400 if country ID is missing', async () => {
            req.params = {};
            await controller.obtenerCiudades(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return cities list', async () => {
            req.params = { paisId: 'PE' };
            (globalThis as any).mockObtenerCiudades.mockResolvedValue([]);

            await controller.obtenerCiudades(req as Request, res as Response);

            expect((globalThis as any).mockObtenerCiudades).toHaveBeenCalledWith('PE');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 500 on error', async () => {
            req.params = { paisId: 'PE' };
            (globalThis as any).mockObtenerCiudades.mockRejectedValue(new Error('Error'));
            await controller.obtenerCiudades(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('marcarPerfilCompletadoReconocido', () => {
        it('should return 400 if id is missing', async () => {
            req.body = {};
            await controller.marcarPerfilCompletadoReconocido(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should update profile status with specified value', async () => {
            req.body = { usuarioId: 'user-1', perfilCompletadoReconocido: false };
            (globalThis as any).mockActualizar.mockResolvedValue({ id: 'user-1' });

            await controller.marcarPerfilCompletadoReconocido(req as Request, res as Response);

            expect((globalThis as any).mockActualizar).toHaveBeenCalledWith('user-1', { perfilCompletadoReconocido: false });
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should default to true if value not provided', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockActualizar.mockResolvedValue({ id: 'user-1' });

            await controller.marcarPerfilCompletadoReconocido(req as Request, res as Response);

            expect((globalThis as any).mockActualizar).toHaveBeenCalledWith('user-1', { perfilCompletadoReconocido: true });
        });

        it('should return 500 on error', async () => {
            req.body = { usuarioId: 'user-1' };
            (globalThis as any).mockActualizar.mockRejectedValue(new Error('Error'));
            await controller.marcarPerfilCompletadoReconocido(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerPerfilPublico', () => {
        it('should return 400 if username is missing', async () => {
            req.params = {};
            await controller.obtenerPerfilPublico(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return profile of existing username', async () => {
            req.params = { username: 'testuser' };
            req.query = { usuarioSolicitanteId: 'solicitor-1' };
            (globalThis as any).mockBuscarPorNombreUsuario.mockResolvedValue({ id: 'user-1' });

            await controller.obtenerPerfilPublico(req as Request, res as Response);

            expect((globalThis as any).mockBuscarPorNombreUsuario).toHaveBeenCalledWith('testuser', 'solicitor-1');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 404 if profile not accessible', async () => {
            req.params = { username: 'testuser' };
            (globalThis as any).mockBuscarPorNombreUsuario.mockResolvedValue(null);

            await controller.obtenerPerfilPublico(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });

        it('should return 500 on error', async () => {
            req.params = { username: 'testuser' };
            (globalThis as any).mockBuscarPorNombreUsuario.mockRejectedValue(new Error('Error'));
            await controller.obtenerPerfilPublico(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('eliminarPerfilEspecifico', () => {
        it('should return 403 if requester user is not admin', async () => {
            // Not logged in or not admin
            req.params = { tipo: 'artista' };
            await controller.eliminarPerfilEspecifico(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(403);

            (req as any).user = { id: 'user-1', rol: 'USER' };
            await controller.eliminarPerfilEspecifico(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(403);
        });

        it('should delete artist profile and relations successfully', async () => {
            (req as any).user = { id: 'user-1', rol: 'SUPER_ADMIN' };
            req.params = { tipo: 'artista' };

            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue({ id: 'profile-1' } as any);
            vi.mocked(prisma.$transaction).mockResolvedValue([] as any);

            await controller.eliminarPerfilEspecifico(req as Request, res as Response);

            expect(prisma.perfilArtista.findUnique).toHaveBeenCalledWith({ where: { usuarioId: 'user-1' } });
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should delete public profile successfully', async () => {
            (req as any).user = { id: 'user-1', rol: 'ADMIN' };
            req.params = { tipo: 'publico' };

            vi.mocked(prisma.perfilPublico.deleteMany).mockResolvedValue({ count: 1 } as any);

            await controller.eliminarPerfilEspecifico(req as Request, res as Response);

            expect(prisma.perfilPublico.deleteMany).toHaveBeenCalledWith({ where: { usuarioId: 'user-1' } });
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should delete discoteca profile successfully', async () => {
            (req as any).user = { id: 'user-1', rol: 'ADMIN' };
            req.params = { tipo: 'discoteca' };

            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue({ id: 'profile-disco-1' } as any);
            vi.mocked(prisma.$transaction).mockResolvedValue([] as any);

            await controller.eliminarPerfilEspecifico(req as Request, res as Response);

            expect(prisma.perfilDiscoteca.findUnique).toHaveBeenCalledWith({ where: { usuarioId: 'user-1' } });
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 400 on invalid profile type', async () => {
            (req as any).user = { id: 'user-1', rol: 'ADMIN' };
            req.params = { tipo: 'invalid' };

            await controller.eliminarPerfilEspecifico(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 500 on database error', async () => {
            (req as any).user = { id: 'user-1', rol: 'ADMIN' };
            req.params = { tipo: 'publico' };
            vi.mocked(prisma.perfilPublico.deleteMany).mockRejectedValue(new Error('DB Error'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.eliminarPerfilEspecifico(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
