import { Usuario } from '../entities/user';

export interface RepositorioSeguidor {
    seguir(seguidorId: string, seguidoId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<void>;
    dejarDeSeguir(seguidorId: string, seguidoId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<void>;
    esSeguidor(seguidorId: string, seguidoId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<boolean>;
    obtenerSeguidores(usuarioId: string, tipo: 'ARTISTA' | 'DISCOTECA'): Promise<Usuario[]>;
    obtenerSeguidos(usuarioId: string): Promise<Record<string, unknown>[]>;
}
