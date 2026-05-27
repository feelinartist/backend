import { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO } from '../entities/user';

export interface RepositorioUsuario {
    crear(datos: CrearUsuarioDTO): Promise<Usuario>;
    buscarPorCorreo(correo: string): Promise<Usuario | null>;
    buscarPorId(id: string, usuarioSolicitanteId?: string): Promise<Usuario | null>;
    buscarPorNombreUsuario(nombreUsuario: string, usuarioSolicitanteId?: string): Promise<Usuario | null>;
    actualizar(id: string, datos: ActualizarUsuarioDTO): Promise<Usuario>;
    bloquear(bloqueadorId: string, bloqueadoId: string): Promise<void>;
    desbloquear(bloqueadorId: string, bloqueadoId: string): Promise<void>;
    obtenerBloqueados(bloqueadorId: string): Promise<Usuario[]>;
    buscarArtistas(filtro: { termino?: string; paisId?: string; usuarioSolicitanteId?: string }): Promise<Usuario[]>;
    obtenerPaises(): Promise<Record<string, unknown>[]>;
    obtenerCiudades(paisId: string): Promise<Record<string, unknown>[]>;
    listarUsuarios(page?: number, limit?: number, termino?: string): Promise<{ usuarios: Usuario[], total: number }>;
    eliminarPermanente(id: string): Promise<void>;
}
