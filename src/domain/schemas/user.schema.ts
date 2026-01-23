import { z } from 'zod';



// Update role schema
export const updateRoleSchema = z.object({
    correo: z.string().email('Email inválido'),
    rol: z.string().min(1, 'El rol es requerido'),
    datosPerfilArtista: z.record(z.unknown()).optional(),
    datosPerfilPublico: z.record(z.unknown()).optional(),
    datosDiscoteca: z.record(z.unknown()).optional(),
    nombreUsuario: z.string().optional(),
    nombre: z.string().optional()
});

// Update profile schema
export const updateProfileSchema = z.object({
    usuarioId: z.string().uuid('ID de usuario inválido'),
    nombre: z.string().optional(),
    nombreUsuario: z.string().optional(),
    imagen: z.string().optional(),
    perfilArtista: z.record(z.unknown()).optional(),
    perfilPublico: z.record(z.unknown()).optional(),
    perfilDiscoteca: z.record(z.unknown()).optional(),
    galeria: z.array(z.object({
        urlImagen: z.string()
    })).optional()
});

// Username check schema
export const usernameCheckSchema = z.object({
    nombreUsuario: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
    usuarioId: z.string().uuid().optional()
});

// Block/unblock user schema
export const blockUserSchema = z.object({
    bloqueadorId: z.string().uuid('ID de bloqueador inválido'),
    bloqueadoId: z.string().uuid('ID de bloqueado inválido')
});

// Search artists schema (query params)
export const searchArtistsSchema = z.object({
    termino: z.string().min(1, 'El término de búsqueda es requerido').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
});
