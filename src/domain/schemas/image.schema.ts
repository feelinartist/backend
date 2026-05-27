import { z } from 'zod';

// Upload gallery images schema
export const uploadGallerySchema = z.object({
    usuarioId: z.uuid({ error: 'ID de usuario inválido' }),
    images: z.array(z.string()).min(1, 'Debe proporcionar al menos una imagen').max(6, 'Máximo 6 imágenes permitidas')
});

// Upload QR payment schema
export const uploadQRSchema = z.object({
    usuarioId: z.uuid({ error: 'ID de usuario inválido' }),
    image: z.string().min(1, 'La imagen QR es requerida'),
    nombreQR: z.string().optional(),
    urlPago: z.url({ error: 'URL de pago inválida' }).optional()
});

// Upload profile image schema
export const uploadProfileSchema = z.object({
    usuarioId: z.uuid({ error: 'ID de usuario inválido' }),
    image: z.string().min(1, 'La imagen es requerida')
});


