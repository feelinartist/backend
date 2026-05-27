import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificarDisponibilidadUsuarioCasoUso } from './verificar-disponibilidad-usuario';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import crypto from 'node:crypto';

vi.mock('node:crypto', () => {
    return {
        default: {
            randomInt: vi.fn(),
        },
        randomInt: vi.fn(),
    };
});

describe('VerificarDisponibilidadUsuarioCasoUso', () => {
    let casoUso: VerificarDisponibilidadUsuarioCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarPorNombreUsuario: vi.fn(),
        };

        // Valor por defecto para randomInt
        let callCount = 0;
        vi.mocked(crypto.randomInt).mockImplementation(() => {
            callCount++;
            return callCount;
        });

        casoUso = new VerificarDisponibilidadUsuarioCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    it('debe retornar disponible true si el nombre de usuario no existe', async () => {
        mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue(null);

        const result = await casoUso.ejecutar('juan');

        expect(mockRepositorioUsuario.buscarPorNombreUsuario).toHaveBeenCalledWith('juan');
        expect(result).toEqual({ disponible: true, sugerencias: [] });
    });

    it('debe retornar disponible false y sugerencias de los patrones preferidos si estan disponibles', async () => {
        // El primero existe, pero los siguientes sugeridos no
        mockRepositorioUsuario.buscarPorNombreUsuario.mockImplementation((username: string) => {
            if (username === 'juan') {
                return Promise.resolve({ id: '123' });
            }
            return Promise.resolve(null);
        });

        const result = await casoUso.ejecutar('juan');

        expect(result.disponible).toBe(false);
        expect(result.sugerencias).toEqual([
            'juan_oficial',
            'juan_pe',
            'soy_juan'
        ]);
        // Debe detenerse después de 3 sugerencias y no seguir buscando los otros patrones
        expect(mockRepositorioUsuario.buscarPorNombreUsuario).toHaveBeenCalledTimes(4); // 'juan' + 3 patrones preferidos
    });

    it('debe recurrir a sugerencias aleatorias si los patrones preferidos estan ocupados', async () => {
        // Juan y todos los patrones preferidos están tomados
        mockRepositorioUsuario.buscarPorNombreUsuario.mockImplementation((username: string) => {
            if (username === 'juan' || username.endsWith('_oficial') || username.endsWith('_pe') || username.startsWith('soy_') || username.endsWith('_music') || username.endsWith('_dj')) {
                return Promise.resolve({ id: 'taken' });
            }
            return Promise.resolve(null); // Los aleatorios están libres
        });

        const result = await casoUso.ejecutar('juan');

        expect(result.disponible).toBe(false);
        expect(result.sugerencias.length).toBe(3);
        // Cada sugerencia debe terminar con un número aleatorio
        result.sugerencias.forEach(sug => {
            expect(sug).match(/^juan_\d+$/);
        });
    });

    it('debe evitar duplicar sugerencias ya existentes en sugerencias aleatorias', async () => {
        // Mock de randomInt controlado para que retorne el mismo número dos veces consecutivas
        vi.mocked(crypto.randomInt)
            .mockReturnValueOnce(500)
            .mockReturnValueOnce(500) // Duplicado
            .mockReturnValueOnce(600)
            .mockReturnValueOnce(700);

        mockRepositorioUsuario.buscarPorNombreUsuario.mockImplementation((username: string) => {
            if (username === 'juan' || username.endsWith('_oficial') || username.endsWith('_pe') || username.startsWith('soy_') || username.endsWith('_music') || username.endsWith('_dj')) {
                return Promise.resolve({ id: 'taken' });
            }
            return Promise.resolve(null);
        });

        const result = await casoUso.ejecutar('juan');

        expect(result.sugerencias).toContain('juan_500');
        expect(result.sugerencias).toContain('juan_600');
        expect(result.sugerencias).toContain('juan_700');
        expect(result.sugerencias.length).toBe(3);
    });

    it('debe detenerse despues de 20 intentos si todos los candidatos aleatorios estan ocupados', async () => {
        // Ningún nombre de usuario candidato está disponible en la base de datos
        mockRepositorioUsuario.buscarPorNombreUsuario.mockResolvedValue({ id: 'taken' });

        const result = await casoUso.ejecutar('juan');

        expect(result.disponible).toBe(false);
        expect(result.sugerencias.length).toBe(0); // Ninguno pudo ser agregado
    });
});
