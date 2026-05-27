import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActualizarUsuarioCasoUso } from './actualizar-usuario';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';

const mockUploadImageFn = vi.fn();
const mockGenerateQrFn = vi.fn();

vi.mock('../../infrastructure/services/local-file-service', () => ({
    LocalFileService: class {
        uploadBase64Image(base64: string, userId: string, folder: string, name: string) {
            return mockUploadImageFn(base64, userId, folder, name);
        }
    }
}));

vi.mock('../../infrastructure/services/qr-service', () => ({
    QrService: class {
        async generateQrCode(url: string) {
            return mockGenerateQrFn(url);
        }
    }
}));

vi.mock('../../infrastructure/services/config-service', () => ({
    configService: {
        get: vi.fn(),
    },
}));

import { configService } from '../../infrastructure/services/config-service';

describe('ActualizarUsuarioCasoUso', () => {
    let casoUso: ActualizarUsuarioCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarPorId: vi.fn(),
            buscarPorNombreUsuario: vi.fn(),
            actualizar: vi.fn(),
        };

        mockUploadImageFn.mockResolvedValue({ url: 'https://uploads/qr_updated.webp' });
        mockGenerateQrFn.mockResolvedValue(Buffer.from('new-qr-buffer'));
        vi.mocked(configService.get).mockResolvedValue('https://localhost:3000');

        casoUso = new ActualizarUsuarioCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    it('debe lanzar un error si el usuario no es encontrado', async () => {
        mockRepositorioUsuario.buscarPorId.mockResolvedValue(null);

        await expect(casoUso.ejecutar({ usuarioId: '123' }))
            .rejects.toThrow('Usuario no encontrado');
    });

    describe('validarCambioNombreUsuario', () => {
        it('debe lanzar error si no es admin y cambia nombreUsuario antes de 30 días', async () => {
            const ahora = new Date();
            const hace15Dias = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
            const usuarioMock = {
                id: '123',
                nombreUsuario: 'antiguo_username',
                ultimoCambioNombreUsuario: hace15Dias,
                rol: { nombre: 'PUBLICO' },
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);

            await expect(casoUso.ejecutar({ usuarioId: '123', nombreUsuario: 'nuevo_username' }))
                .rejects.toThrow(/Debes esperar \d+ días/);
        });

        it('debe permitir cambiar nombreUsuario si es admin incluso antes de 30 días', async () => {
            const ahora = new Date();
            const hace15Dias = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
            const usuarioMock = {
                id: '123',
                nombreUsuario: 'antiguo_username',
                ultimoCambioNombreUsuario: hace15Dias,
                rol: { nombre: 'ADMIN' },
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(null);
            mockRepositorioUsuario.actualizar.mockResolvedValue({ ...usuarioMock, nombreUsuario: 'nuevo_username' });

            const res = await casoUso.ejecutar({ usuarioId: '123', nombreUsuario: 'nuevo_username' });
            expect(res.nombreUsuario).toBe('nuevo_username');
        });

        it('debe lanzar error si el nuevo nombreUsuario ya está en uso por otro usuario', async () => {
            const usuarioMock = {
                id: '123',
                nombreUsuario: 'antiguo_username',
                rol: { nombre: 'PUBLICO' },
            };
            const otroUsuarioMock = {
                id: '456',
                nombreUsuario: 'nuevo_username',
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(otroUsuarioMock);

            await expect(casoUso.ejecutar({ usuarioId: '123', nombreUsuario: 'nuevo_username' }))
                .rejects.toThrow('El nombre de usuario ya está en uso.');
        });

        it('debe permitir el cambio si el nombre de usuario coincide con el actual (misma persona)', async () => {
            const usuarioMock = {
                id: '123',
                nombreUsuario: 'mi_username',
                rol: { nombre: 'PUBLICO' },
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            const res = await casoUso.ejecutar({ usuarioId: '123', nombreUsuario: 'mi_username' });
            expect(res).toBeDefined();
        });

        it('debe permitir cambiar nombreUsuario si no es admin y ya pasaron 30 dias', async () => {
            const ahora = new Date();
            const hace31Dias = new Date(ahora.getTime() - 31 * 24 * 60 * 60 * 1000);
            const usuarioMock = {
                id: '123',
                nombreUsuario: 'antiguo_username',
                ultimoCambioNombreUsuario: hace31Dias,
                rol: { nombre: 'PUBLICO' },
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(null);
            mockRepositorioUsuario.actualizar.mockResolvedValue({ ...usuarioMock, nombreUsuario: 'nuevo_username' });

            const res = await casoUso.ejecutar({ usuarioId: '123', nombreUsuario: 'nuevo_username' });
            expect(res.nombreUsuario).toBe('nuevo_username');
        });
    });

    describe('validarCambioNombre', () => {
        it('debe lanzar error si no es admin y cambia nombre antes de 7 días', async () => {
            const ahora = new Date();
            const hace3Dias = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000);
            const usuarioMock = {
                id: '123',
                nombre: 'Antiguo Nombre',
                ultimoCambioNombre: hace3Dias,
                rol: { nombre: 'PUBLICO' },
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);

            await expect(casoUso.ejecutar({ usuarioId: '123', nombre: 'Nuevo Nombre' }))
                .rejects.toThrow(/Debes esperar \d+ días/);
        });

        it('debe permitir cambiar nombre si es admin incluso antes de 7 días', async () => {
            const ahora = new Date();
            const hace3Dias = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000);
            const usuarioMock = {
                id: '123',
                nombre: 'Antiguo Nombre',
                ultimoCambioNombre: hace3Dias,
                rol: { nombre: 'SUPERADMIN' },
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue({ ...usuarioMock, nombre: 'Nuevo Nombre' });

            const res = await casoUso.ejecutar({ usuarioId: '123', nombre: 'Nuevo Nombre' });
            expect(res.nombre).toBe('Nuevo Nombre');
        });

        it('debe permitir cambiar nombre si no es admin y ya pasaron 7 dias', async () => {
            const ahora = new Date();
            const hace8Dias = new Date(ahora.getTime() - 8 * 24 * 60 * 60 * 1000);
            const usuarioMock = {
                id: '123',
                nombre: 'Antiguo Nombre',
                ultimoCambioNombre: hace8Dias,
                rol: { nombre: 'PUBLICO' },
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue({ ...usuarioMock, nombre: 'Nuevo Nombre' });

            const res = await casoUso.ejecutar({ usuarioId: '123', nombre: 'Nuevo Nombre' });
            expect(res.nombre).toBe('Nuevo Nombre');
        });
    });

    describe('buildPerfilActualizacion', () => {
        it('debe mapear correctamente el perfil de artista y regenerar el QR de musica al cambiar username', async () => {
            const usuarioMock = {
                id: '123',
                nombreUsuario: 'antiguo_username',
                rol: { nombre: 'PUBLICO' },
                perfilArtista: {},
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(null);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            const dto = {
                usuarioId: '123',
                nombreUsuario: 'nuevo_username',
                pais: 'Colombia',
                ciudad: 'Medellin',
                zonaHoraria: 'America/Bogota',
                telefono: '123456789',
                codigoTelefono: '+57',
                redesSociales: [{ red: 'instagram', url: '...' }],
                metodosDonacion: [{ metodo: 'paypal', url: '...' }],
                galeria: ['img1.jpg'],
                biografia: 'Nueva bio',
                categoria: 'Cantante',
                tarifaPorHora: 100,
                moneda: 'USD',
                lugaresConocidos: ['Club A'],
                fechaInicio: '2025-01-01',
                pagoQR: 'pago.jpg',
                musicQR: 'music.jpg',
                nombreQR: 'nombre.jpg',
                urlPago: 'urlpago',
                urlYoutubeFavorito: 'yturl',
                urlSoundCloudFavorito: 'scurl',
            };

            await casoUso.ejecutar(dto);

            expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL', 'https://localhost:3000');
            expect(mockGenerateQrFn).toHaveBeenCalledWith('https://localhost:3000/artist/nuevo_username/music');
            expect(mockUploadImageFn).toHaveBeenCalledWith(
                'data:image/png;base64,bmV3LXFyLWJ1ZmZlcg==',
                '123',
                'music',
                'qr'
            );

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', expect.objectContaining({
                perfilArtista: {
                    pais: 'Colombia',
                    ciudad: 'Medellin',
                    zonaHoraria: 'America/Bogota',
                    numeroTelefono: '123456789',
                    codigoTelefono: '+57',
                    redesSociales: [{ red: 'instagram', url: '...' }],
                    metodosDonacion: [{ metodo: 'paypal', url: '...' }],
                    galeria: ['img1.jpg'],
                    biografia: 'Nueva bio',
                    categoria: 'Cantante',
                    tarifaPorHora: 100,
                    moneda: 'USD',
                    lugaresConocidos: ['Club A'],
                    fechaInicio: new Date('2025-01-01'),
                    pagoQR: 'pago.jpg',
                    musicQR: 'https://uploads/qr_updated.webp', // Actualizado por la regeneración
                    nombreQR: 'nombre.jpg',
                    urlPago: 'urlpago',
                    urlYoutubeFavorito: 'yturl',
                    urlSoundCloudFavorito: 'scurl',
                }
            }));
        });

        it('debe mapear el perfil de artista sin regenerar el QR si el username no cambia', async () => {
            const usuarioMock = {
                id: '123',
                nombreUsuario: 'artista_username',
                rol: { nombre: 'PUBLICO' },
                perfilArtista: {},
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                usuarioId: '123',
                pais: 'Colombia',
                biografia: 'Bio sin cambiar username',
            });

            expect(mockGenerateQrFn).not.toHaveBeenCalled();
            expect(mockUploadImageFn).not.toHaveBeenCalled();
            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', expect.objectContaining({
                perfilArtista: {
                    pais: 'Colombia',
                    biografia: 'Bio sin cambiar username',
                }
            }));
        });

        it('debe capturar el error y no fallar si falla la regeneracion de QR para artista', async () => {
            const usuarioMock = {
                id: '123',
                nombreUsuario: 'antiguo_username',
                rol: { nombre: 'PUBLICO' },
                perfilArtista: {},
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(null);
            mockGenerateQrFn.mockRejectedValue(new Error('QR failure'));
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await casoUso.ejecutar({ usuarioId: '123', nombreUsuario: 'nuevo_username' });

            expect(consoleSpy).toHaveBeenCalled();
            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('debe mapear correctamente el perfil publico', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
                perfilPublico: {},
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                usuarioId: '123',
                pais: 'Colombia',
                ciudad: 'Cali',
                zonaHoraria: 'America/Bogota',
                telefono: '987654321',
                codigoTelefono: '+57',
            });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', expect.objectContaining({
                perfilPublico: {
                    pais: 'Colombia',
                    ciudad: 'Cali',
                    zonaHoraria: 'America/Bogota',
                    numeroTelefono: '987654321',
                    codigoTelefono: '+57',
                }
            }));
        });

        it('debe mapear correctamente el perfil discoteca', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
                perfilDiscoteca: {},
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                usuarioId: '123',
                pais: 'Colombia',
                ciudad: 'Medellin',
                zonaHoraria: 'America/Bogota',
                telefono: '987654321',
                codigoTelefono: '+57',
                fechaFundacion: '2010-05-10',
            });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', expect.objectContaining({
                perfilDiscoteca: {
                    pais: 'Colombia',
                    ciudad: 'Medellin',
                    zonaHoraria: 'America/Bogota',
                    numeroTelefono: '987654321',
                    codigoTelefono: '+57',
                    fechaFundacion: new Date('2010-05-10'),
                }
            }));
        });

        it('debe crear un perfil publico por defecto si el usuario no tiene perfiles en base de datos', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
            };

            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                usuarioId: '123',
                pais: 'Colombia',
                ciudad: 'Bogota',
                zonaHoraria: 'America/Bogota',
                telefono: '555555',
                codigoTelefono: '+57',
                imagen: 'perfil.jpg',
            });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', expect.objectContaining({
                perfilPublico: {
                    pais: 'Colombia',
                    ciudad: 'Bogota',
                    zonaHoraria: 'America/Bogota',
                    numeroTelefono: '555555',
                    codigoTelefono: '+57',
                    imagen: 'perfil.jpg',
                }
            }));
        });
    });
});
