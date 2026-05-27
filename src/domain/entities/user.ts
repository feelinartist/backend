export interface Usuario {
    id: string;
    correo: string;
    nombre?: string | null;
    imagen?: string | null;
    rol?: { id: string; nombre: string } | null;
    perfilArtista?: {
        id: string;
        biografia?: string | null;
        codigoQR?: string | null;
        redesSociales?: Array<{
            id: string;
            nombreUsuario: string;
            redSocial: {
                id: string;
                nombre: string;
                urlBase: string;
                icono?: string | null;
            }
        }>;
        metodosDonacion?: Array<{
            id: string;
            numeroCuenta?: string | null;
            metodoDonacion: {
                id: string;
                nombre: string;
            }
        }>;
        galeria?: Array<{
            id: string;
            urlImagen: string;
        }>;
        [key: string]: unknown; // Allow other properties
    };
    perfilPublico?: Record<string, unknown>;
    perfilDiscoteca?: Record<string, unknown>;
    nombreUsuario?: string | null;
    creadoEn: Date;
    actualizadoEn: Date;
    ultimoCambioNombreUsuario?: Date | null;
    ultimoCambioNombre?: Date | null;
    estadoCuenta?: 'ACTIVO' | 'DESHABILITADO' | 'ELIMINACION_PENDIENTE' | 'BANEADO';
    fechaEliminacionProgramada?: Date | null;
    perfilCompletadoReconocido?: boolean;
}

export interface Rol {
    id: string;
    nombre: string;
}

export interface CrearUsuarioDTO {
    correo: string;
    nombre?: string;
    imagen?: string;
    rol?: string; // Role name
    nombreUsuario?: string;
}

export interface ActualizarUsuarioDTO {
    nombre?: string;
    imagen?: string;
    rol?: string; // Role name
    perfilArtista?: Record<string, unknown>;
    perfilPublico?: Record<string, unknown>;
    perfilDiscoteca?: Record<string, unknown>;
    nombreUsuario?: string;
    ultimoCambioNombreUsuario?: Date;
    ultimoCambioNombre?: Date;
    estadoCuenta?: 'ACTIVO' | 'DESHABILITADO' | 'ELIMINACION_PENDIENTE' | 'BANEADO';
    fechaEliminacionProgramada?: Date | null;
    pagoQR?: string;
    musicQR?: string;
    nombreQR?: string;
    urlPago?: string;
    perfilCompletadoReconocido?: boolean;
}
