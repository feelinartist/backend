import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MigrarRolUsuarioCasoUso } from './migrar-rol-usuario';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';

describe('MigrarRolUsuarioCasoUso', () => {
    let casoUso: MigrarRolUsuarioCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarPorId: vi.fn(),
            actualizar: vi.fn(),
        };

        casoUso = new MigrarRolUsuarioCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    it('debe lanzar error si el usuario no es encontrado', async () => {
        mockRepositorioUsuario.buscarPorId.mockResolvedValue(null);

        await expect(casoUso.ejecutar('123', 'ARTISTA', {}))
            .rejects.toThrow('Usuario no encontrado');
    });

    it('debe lanzar error si el usuario ya tiene el rol destino', async () => {
        const usuarioMock = {
            id: '123',
            rol: { nombre: 'ARTISTA' },
        };
        mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);

        await expect(casoUso.ejecutar('123', 'ARTISTA', {}))
            .rejects.toThrow('El usuario ya tiene este rol');
    });

    it('debe lanzar error si se pasa un rol no soportado para migracion', async () => {
        const usuarioMock = {
            id: '123',
            rol: { nombre: 'PUBLICO' },
        };
        mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);

        await expect(casoUso.ejecutar('123', 'OTRO_ROL', {}))
            .rejects.toThrow('Rol no válido para migración');
    });

    describe('migracion a ARTISTA', () => {
        it('debe lanzar error si no tiene perfilArtista previo y faltan campos obligatorios', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
                perfilArtista: null,
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);

            await expect(casoUso.ejecutar('123', 'ARTISTA', { categoria: 'Rock' }))
                .rejects.toThrow(/Faltan datos requeridos/);
        });

        it('debe migrar correctamente si tiene perfilArtista previo', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
                perfilArtista: { id: 'p1' },
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar('123', 'ARTISTA', { biografia: 'Nueva bio' });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                rol: 'ARTISTA',
                perfilArtista: {
                    usuarioId: '123',
                    biografia: 'Nueva bio',
                },
            });
        });

        it('debe migrar correctamente si no tiene perfil previo pero se pasan todos los datos', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
                perfilArtista: null,
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar('123', 'ARTISTA', {
                nombreArtistico: 'El Gran Musico',
                categoria: 'Rock',
                ciudad: 'Bogota',
                pais: 'Colombia',
            });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                rol: 'ARTISTA',
                nombre: 'El Gran Musico',
                perfilArtista: {
                    usuarioId: '123',
                    categoria: 'Rock',
                    ciudad: 'Bogota',
                    pais: 'Colombia',
                },
            });
        });
    });

    describe('migracion a DISCOTECA', () => {
        it('debe lanzar error si no tiene perfilDiscoteca previo y faltan campos obligatorios', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
                perfilDiscoteca: null,
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);

            await expect(casoUso.ejecutar('123', 'DISCOTECA', { ciudad: 'Bogota' }))
                .rejects.toThrow(/Faltan datos requeridos/);
        });

        it('debe migrar correctamente si tiene perfil previo', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
                perfilDiscoteca: { id: 'p2' },
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar('123', 'DISCOTECA', { zonaHoraria: 'UTC-5' });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                rol: 'DISCOTECA',
                perfilDiscoteca: {
                    usuarioId: '123',
                    zonaHoraria: 'UTC-5',
                },
            });
        });

        it('debe migrar correctamente si no tiene perfil previo pero se pasan todos los datos', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'PUBLICO' },
                perfilDiscoteca: null,
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar('123', 'DISCOTECA', {
                nombre: 'The Disco',
                ciudad: 'Bogota',
                pais: 'Colombia',
            });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                rol: 'DISCOTECA',
                nombre: 'The Disco',
                perfilDiscoteca: {
                    usuarioId: '123',
                    ciudad: 'Bogota',
                    pais: 'Colombia',
                },
            });
        });
    });

    describe('migracion a PUBLICO', () => {
        it('debe lanzar error si no tiene perfilPublico previo y faltan campos obligatorios', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'ARTISTA' },
                perfilPublico: null,
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);

            await expect(casoUso.ejecutar('123', 'PUBLICO', { ciudad: 'Bogota' }))
                .rejects.toThrow(/Faltan datos requeridos/);
        });

        it('debe migrar correctamente si tiene perfil previo', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'ARTISTA' },
                perfilPublico: { id: 'p3' },
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar('123', 'PUBLICO', { codigoTelefono: '+57' });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                rol: 'PUBLICO',
                perfilPublico: {
                    usuarioId: '123',
                    codigoTelefono: '+57',
                },
            });
        });

        it('debe migrar correctamente si no tiene perfil previo pero se pasan todos los datos', async () => {
            const usuarioMock = {
                id: '123',
                rol: { nombre: 'ARTISTA' },
                perfilPublico: null,
            };
            mockRepositorioUsuario.buscarPorId.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar('123', 'PUBLICO', {
                nombreCompleto: 'Juan Completo',
                ciudad: 'Bogota',
                pais: 'Colombia',
            });

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                rol: 'PUBLICO',
                nombre: 'Juan Completo',
                perfilPublico: {
                    usuarioId: '123',
                    ciudad: 'Bogota',
                    pais: 'Colombia',
                },
            });
        });
    });
});
