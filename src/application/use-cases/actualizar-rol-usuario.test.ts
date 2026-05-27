import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActualizarRolUsuarioCasoUso } from './actualizar-rol-usuario';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { updateRoleSchema } from '../../domain/schemas/user.schema';

const mockUploadBase64Image = vi.fn();
const mockGenerateQrCode = vi.fn();

vi.mock('../../infrastructure/services/local-file-service', () => {
    return {
        LocalFileService: class {
            uploadBase64Image = mockUploadBase64Image;
        }
    };
});

vi.mock('../../infrastructure/services/qr-service', () => {
    return {
        QrService: class {
            generateQrCode = mockGenerateQrCode;
        }
    };
});

vi.mock('../../infrastructure/services/config-service', () => ({
    configService: {
        get: vi.fn(),
    },
}));

import { configService } from '../../infrastructure/services/config-service';

describe('ActualizarRolUsuarioCasoUso', () => {
    let casoUso: ActualizarRolUsuarioCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarPorCorreo: vi.fn(),
            actualizar: vi.fn(),
        };

        mockUploadBase64Image.mockResolvedValue({ url: 'https://uploads/qr.webp' });
        mockGenerateQrCode.mockResolvedValue(Buffer.from('qr-code-buffer'));
        vi.mocked(configService.get).mockResolvedValue('https://localhost:3000');

        casoUso = new ActualizarRolUsuarioCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    it('debe lanzar error si el usuario no es encontrado', async () => {
        mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);

        await expect(casoUso.ejecutar('test@test.com', 'ARTISTA'))
            .rejects.toThrow('Usuario no encontrado');
    });

    it('debe actualizar el rol a ARTISTA y generar un QR con éxito', async () => {
        const usuarioMock = {
            id: 'user-123',
            nombreUsuario: 'artista_username',
            rol: { nombre: 'PUBLICO' },
        };
        mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
        mockRepositorioUsuario.actualizar.mockResolvedValue({ ...usuarioMock, rol: { nombre: 'ARTISTA' } });

        const datosPerfilArtista = { bio: 'Soy un artista' };
        const result = await casoUso.ejecutar('test@test.com', 'ARTISTA', datosPerfilArtista);

        expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL', 'https://localhost:3000');
        expect(mockGenerateQrCode).toHaveBeenCalledWith('https://localhost:3000/artist/artista_username/music');
        expect(mockUploadBase64Image).toHaveBeenCalledWith(
            'data:image/png;base64,cXItY29kZS1idWZmZXI=',
            'user-123',
            'music',
            'qr'
        );
        expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('user-123', {
            perfilArtista: {
                bio: 'Soy un artista',
                musicQR: 'https://uploads/qr.webp',
            },
            perfilPublico: undefined,
            nombreUsuario: undefined,
            nombre: undefined,
            rol: 'ARTISTA',
        });
        expect(result).toBeDefined();
    });

    it('debe continuar sin generar QR si ocurre un error en QrService', async () => {
        const usuarioMock = {
            id: 'user-123',
            nombreUsuario: 'artista_username',
            rol: { nombre: 'PUBLICO' },
        };
        mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
        mockGenerateQrCode.mockRejectedValue(new Error('QR Error'));
        mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await casoUso.ejecutar('test@test.com', 'ARTISTA');

        expect(consoleSpy).toHaveBeenCalled();
        expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('user-123', {
            perfilArtista: undefined,
            perfilPublico: undefined,
            nombreUsuario: undefined,
            nombre: undefined,
            rol: 'ARTISTA',
        });
        expect(result).toBeDefined();
        consoleSpy.mockRestore();
    });

    it('debe preservar el rol original si el usuario es SUPER_ADMIN o ADMIN', async () => {
        const usuarioMock = {
            id: 'admin-123',
            nombreUsuario: 'admin_user',
            rol: { nombre: 'SUPER_ADMIN' },
        };
        mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
        mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

        await casoUso.ejecutar('admin@test.com', 'ARTISTA');

        expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('admin-123', {
            perfilArtista: expect.any(Object),
            perfilPublico: undefined,
            nombreUsuario: undefined,
            nombre: undefined,
        });
    });

    it('debe configurar el perfilDiscoteca correctamente si el rol es DISCOTECA', async () => {
        const usuarioMock = {
            id: 'disco-123',
            nombreUsuario: 'disco_user',
            rol: { nombre: 'PUBLICO' },
        };
        mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
        mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

        const datosDiscoteca = {
            ciudad: 'Bogota',
            pais: 'Colombia',
            fechaFundacion: '2020-01-01T00:00:00.000Z',
            codigoTelefono: '+57',
            numeroTelefono: '3001234567',
            zonaHoraria: 'America/Bogota',
        };

        await casoUso.ejecutar('disco@test.com', 'DISCOTECA', undefined, undefined, datosDiscoteca);

        expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('disco-123', {
            perfilArtista: undefined,
            perfilPublico: undefined,
            nombreUsuario: undefined,
            nombre: undefined,
            rol: 'DISCOTECA',
            perfilDiscoteca: {
                ciudad: 'Bogota',
                pais: 'Colombia',
                fechaFundacion: new Date('2020-01-01T00:00:00.000Z'),
                codigoTelefono: '+57',
                numeroTelefono: '3001234567',
                zonaHoraria: 'America/Bogota',
            },
        });
    });

    it('debe manejar fechaFundacion ausente si el rol es DISCOTECA', async () => {
        const usuarioMock = {
            id: 'disco-123',
            nombreUsuario: 'disco_user',
            rol: { nombre: 'PUBLICO' },
        };
        mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
        mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

        const datosDiscoteca = {
            ciudad: 'Bogota',
            pais: 'Colombia',
            codigoTelefono: '+57',
            numeroTelefono: '3001234567',
            zonaHoraria: 'America/Bogota',
        };

        await casoUso.ejecutar('disco@test.com', 'DISCOTECA', undefined, undefined, datosDiscoteca);

        expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('disco-123', {
            perfilArtista: undefined,
            perfilPublico: undefined,
            nombreUsuario: undefined,
            nombre: undefined,
            rol: 'DISCOTECA',
            perfilDiscoteca: {
                ciudad: 'Bogota',
                pais: 'Colombia',
                fechaFundacion: undefined,
                codigoTelefono: '+57',
                numeroTelefono: '3001234567',
                zonaHoraria: 'America/Bogota',
            },
        });
    });

    it('debe saltarse la generacion de QR si no hay username disponible', async () => {
        const usuarioMock = {
            id: 'user-123',
            nombreUsuario: undefined,
            rol: { nombre: 'PUBLICO' },
        };
        mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
        mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

        await casoUso.ejecutar('test@test.com', 'ARTISTA');

        expect(mockGenerateQrCode).not.toHaveBeenCalled();
        expect(mockUploadBase64Image).not.toHaveBeenCalled();
    });

    it('debe validar updateRoleSchema correctamente con un rol inválido', () => {
        const result = updateRoleSchema.safeParse({
            correo: 'test@correo.com',
            rol: 'INVALID_ROLE'
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const error = result.error.format();
            expect(error.rol?._errors[0]).toBe('Rol inválido. Debe ser ARTISTA, PUBLICO o DISCOTECA');
        }
    });
});

