import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define dynamic mock implementation using globalThis to bypass vi.mock hoisting
(globalThis as any).mockDeleteImageImpl = vi.fn().mockResolvedValue(true);

vi.mock('../services/local-file-service', () => {
    return {
        LocalFileService: class MockLocalFileService {
            deleteImage = vi.fn().mockImplementation((...args) => {
                return (globalThis as any).mockDeleteImageImpl(...args);
            });
        }
    };
});

import { RepositorioUsuarioPrisma } from './prisma-user-repository';
import prisma from '../database/prisma';
import { redisService } from '../services/redis-service';

vi.mock('../services/redis-service', () => {
    return {
        redisService: {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
        }
    };
});

describe('RepositorioUsuarioPrisma', () => {
    let repository: RepositorioUsuarioPrisma;

    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis as any).mockDeleteImageImpl.mockReset();
        (globalThis as any).mockDeleteImageImpl.mockResolvedValue(true);
        vi.mocked(redisService.del).mockResolvedValue(1 as any);
        repository = new RepositorioUsuarioPrisma();
    });

    it('crear: should create user and update creadoPor audit field', async () => {
        const mockUser = {
            id: 'user-1',
            correo: 'user@test.com',
            nombre: 'User Test',
            nombreUsuario: 'usertest',
            rol: { id: 'rol-1', nombre: 'ARTISTA' },
            creadoEn: new Date(),
            actualizadoEn: new Date(),
        };

        vi.mocked(prisma.usuario.create).mockResolvedValue(mockUser as any);
        vi.mocked(prisma.usuario.update).mockResolvedValue({} as any);

        const result = await repository.crear({
            correo: 'user@test.com',
            nombre: 'User Test',
            nombreUsuario: 'usertest',
            rol: 'ARTISTA'
        });

        expect(prisma.usuario.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    correo: 'user@test.com',
                    nombre: 'User Test',
                    rol: { connect: { nombre: 'ARTISTA' } }
                })
            })
        );
        expect(prisma.usuario.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { creadoPor: 'user-1' }
        });
        expect(result.id).toBe('user-1');
    });

    it('buscarPorCorreo: should find user and return mapToEntity', async () => {
        const mockUser = {
            id: 'user-1',
            correo: 'user@test.com',
            nombre: 'User Test',
            rol: null
        };
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

        const result = await repository.buscarPorCorreo('user@test.com');
        expect(result?.id).toBe('user-1');
        expect(prisma.usuario.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { correo: 'user@test.com' } })
        );
    });

    it('buscarPorCorreo: should return null if user not found', async () => {
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
        const result = await repository.buscarPorCorreo('none@test.com');
        expect(result).toBeNull();
    });

    it('buscarPorCorreo: should log and throw error on database failure', async () => {
        const error = new Error('DB Error');
        vi.mocked(prisma.usuario.findUnique).mockRejectedValue(error);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(repository.buscarPorCorreo('user@test.com')).rejects.toThrow('DB Error');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('buscarPorId: should find user and filter out if blocked', async () => {
        const mockUser = {
            id: 'user-1',
            bloqueados: [{ bloqueadoId: 'solicitor-1' }],
            bloqueadoPor: []
        };
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

        // When solicitor is blocked/blocking
        const resultBlocked = await repository.buscarPorId('user-1', 'solicitor-1');
        expect(resultBlocked).toBeNull();

        // When not blocked
        const mockUserNotBlocked = {
            id: 'user-1',
            bloqueados: [],
            bloqueadoPor: []
        };
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserNotBlocked as any);
        const resultNotBlocked = await repository.buscarPorId('user-1', 'solicitor-1');
        expect(resultNotBlocked?.id).toBe('user-1');
    });

    it('buscarPorId: should return null if not found', async () => {
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
        const result = await repository.buscarPorId('unknown');
        expect(result).toBeNull();
    });

    it('buscarPorNombreUsuario: should retrieve cached profile if requested publicly', async () => {
        const mockUser = { id: 'user-1', nombreUsuario: 'testuser' };
        vi.mocked(redisService.get).mockResolvedValue(JSON.stringify(mockUser));

        const result = await repository.buscarPorNombreUsuario('testuser');
        expect(result?.id).toBe('user-1');
        expect(redisService.get).toHaveBeenCalledWith('user:profile:testuser');
        expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
    });

    it('buscarPorNombreUsuario: should query database, cache result and return entity', async () => {
        const mockUser = { id: 'user-1', nombreUsuario: 'testuser' };
        vi.mocked(redisService.get).mockResolvedValue(null);
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

        const result = await repository.buscarPorNombreUsuario('testuser');
        expect(result?.id).toBe('user-1');
        expect(redisService.set).toHaveBeenCalledWith(
            'user:profile:testuser',
            expect.any(String),
            600
        );
    });

    it('buscarPorNombreUsuario: should handle Redis errors gracefully', async () => {
        const mockUser = { id: 'user-1', nombreUsuario: 'testuser' };
        vi.mocked(redisService.get).mockRejectedValue(new Error('Redis Down'));
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);
        vi.mocked(redisService.set).mockRejectedValue(new Error('Redis Down'));

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await repository.buscarPorNombreUsuario('testuser');
        expect(result?.id).toBe('user-1');
        expect(warnSpy).toHaveBeenCalledTimes(2);

        warnSpy.mockRestore();
    });

    it('buscarPorNombreUsuario: should return null if solicitor is blocked/blocking', async () => {
        const mockUserBlocked = {
            id: 'user-1',
            nombreUsuario: 'blockeduser',
            bloqueados: [{ bloqueadoId: 'solicitor-1' }],
            bloqueadoPor: []
        };
        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBlocked as any);

        const result = await repository.buscarPorNombreUsuario('blockeduser', 'solicitor-1');
        expect(result).toBeNull();
    });

    it('actualizar: should generate update data and invalidate cache', async () => {
        const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
        const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
        vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
        vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue({ id: 'profile-1', pagoQR: 'https://example.com/upload/v123/pago_qr_old.jpg' } as any);
        vi.mocked(prisma.galeriaArtista.findMany).mockResolvedValue([{ urlImagen: 'https://example.com/uploads/users/123/galeria/img_old.png' }] as any);

        const result = await repository.actualizar('user-1', {
            nombreUsuario: 'testnew',
            rol: 'ARTISTA',
            perfilArtista: {
                biografia: 'Bio text',
                pagoQR: 'https://example.com/upload/v123/pago_qr.jpg',
                redesSociales: [
                    { redSocialId: 'ig', nombreUsuario: 'insta_user' },
                    { redSocialId: 'wa', codigoTelefono: '+51', numeroTelefono: '999999999' }
                ],
                metodosDonacion: [
                    { metodoDonacionId: 'yape', numeroTelefono: '999999999' }
                ],
                galeria: [
                    'https://example.com/uploads/users/123/galeria/img1.png',
                    { urlImagen: 'https://example.com/uploads/users/123/galeria/img2.png' }
                ]
            }
        });

        expect(prisma.usuario.update).toHaveBeenCalled();
        expect(redisService.del).toHaveBeenCalledWith('user:profile:testold');
        expect(redisService.del).toHaveBeenCalledWith('user:profile:testnew');
        expect(result.nombreUsuario).toBe('testnew');
    });

    it('actualizar: should handle perfilPublico and perfilDiscoteca update, and ignore cache deletion errors', async () => {
        const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
        const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
        vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
        vi.mocked(redisService.del).mockRejectedValue(new Error('Redis delete error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await repository.actualizar('user-1', {
            nombreUsuario: 'testnew',
            perfilPublico: {
                ciudad: 'Lima',
                pais: 'PE',
                zonaHoraria: 'America/Lima'
            },
            perfilDiscoteca: {
                nombreComercial: 'Discoteca Test',
                ciudad: 'Lima',
                pais: 'PE',
                zonaHoraria: 'America/Lima'
            }
        });

        expect(prisma.usuario.update).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Error invalidating cache:', expect.any(Error));
        expect(result.nombreUsuario).toBe('testnew');
        consoleSpy.mockRestore();
    });

    it('actualizar: should log error if LocalFileService.deleteImage fails', async () => {
        const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
        const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
        vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
        vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue({ id: 'profile-1', pagoQR: 'https://example.com/upload/v123/pago_qr_old.jpg' } as any);
        vi.mocked(prisma.galeriaArtista.findMany).mockResolvedValue([{ urlImagen: 'https://example.com/uploads/users/123/galeria/img_old.png' }] as any);

        (globalThis as any).mockDeleteImageImpl.mockRejectedValue(new Error('Delete image failed'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await repository.actualizar('user-1', {
            perfilArtista: {
                pagoQR: 'https://example.com/upload/v123/pago_qr.jpg',
                galeria: [
                    'https://example.com/uploads/users/123/galeria/img1.png'
                ]
            }
        });

        expect(consoleSpy).toHaveBeenCalledWith('Error deleting QR image:', expect.any(Error));
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting images:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('bloquear and desbloquear: should insert and delete blocker relationship', async () => {
        vi.mocked(prisma.bloqueo.create).mockResolvedValue({} as any);
        await repository.bloquear('blocker', 'blocked');
        expect(prisma.bloqueo.create).toHaveBeenCalledWith({
            data: {
                bloqueadorId: 'blocker',
                bloqueadoId: 'blocked',
                creadoPor: 'blocker'
            }
        });

        vi.mocked(prisma.bloqueo.deleteMany).mockResolvedValue({ count: 1 });
        await repository.desbloquear('blocker', 'blocked');
        expect(prisma.bloqueo.deleteMany).toHaveBeenCalledWith({
            where: {
                bloqueadorId: 'blocker',
                bloqueadoId: 'blocked'
            }
        });
    });

    it('obtenerBloqueados: should retrieve and map list of blocked users', async () => {
        const mockBloqueos = [
            { bloqueado: { id: 'blocked-1', correo: 'b1@test.com' } },
            { bloqueado: { id: 'blocked-2', correo: 'b2@test.com' } }
        ];
        vi.mocked(prisma.bloqueo.findMany).mockResolvedValue(mockBloqueos as any);

        const result = await repository.obtenerBloqueados('blocker-1');
        expect(result.length).toBe(2);
        expect(result[0].id).toBe('blocked-1');
    });

    it('buscarArtistas: should find active artists according to filters', async () => {
        const mockArtists = [
            { id: 'artist-1', rol: { nombre: 'ARTISTA' } }
        ];
        vi.mocked(prisma.usuario.findMany).mockResolvedValue(mockArtists as any);

        const result = await repository.buscarArtistas({
            termino: 'test',
            paisId: 'PE',
            usuarioSolicitanteId: 'solicitor-1'
        });

        expect(result.length).toBe(1);
        expect(prisma.usuario.findMany).toHaveBeenCalled();
    });

    it('obtenerPaises and obtenerCiudades: should return empty lists', async () => {
        expect(await repository.obtenerPaises()).toEqual([]);
        expect(await repository.obtenerCiudades('PE')).toEqual([]);
    });

    it('listarUsuarios: should return user page and total count', async () => {
        const mockUsers = [
            { id: 'user-1', correo: 'u1@test.com' }
        ];
        vi.mocked(prisma.usuario.findMany).mockResolvedValue(mockUsers as any);
        vi.mocked(prisma.usuario.count).mockResolvedValue(10);

        const result = await repository.listarUsuarios(1, 10, 'search');
        expect(result.total).toBe(10);
        expect(result.usuarios.length).toBe(1);
        expect(result.usuarios[0].id).toBe('user-1');
    });

    it('eliminarPermanente: should delete user', async () => {
        vi.mocked(prisma.usuario.delete).mockResolvedValue({} as any);
        await repository.eliminarPermanente('user-1');
        expect(prisma.usuario.delete).toHaveBeenCalledWith({
            where: { id: 'user-1' }
        });
    });

    it('extractPublicIdFromUrl: handles unexpected paths or errors gracefully', () => {
        const badUrl = 'not-a-url';
        const result = (repository as any).extractPublicIdFromUrl(badUrl);
        expect(result).toBeNull();
        
        // Trigger try/catch block with invalid arguments
        const errorResult = (repository as any).extractPublicIdFromUrl(undefined);
        expect(errorResult).toBeNull();
    });
});
