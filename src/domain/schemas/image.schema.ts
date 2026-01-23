import { z } from 'zod';

// Upload gallery images schema
export const uploadGallerySchema = z.object({
    usuarioId: z.string().uuid('ID de usuario inválido'),
    images: z.array(z.string()).min(1, 'Debe proporcionar al menos una imagen').max(6, 'Máximo 6 imágenes permitidas')
});

// Upload QR payment schema
export const uploadQRSchema = z.object({
    usuarioId: z.string().uuid('ID de usuario inválido'),
    qrImage: z.string().min(1, 'La imagen QR es requerida'),
    nombreQR: z.string().optional(),
    urlPago: z.string().url('URL de pago inválida').optional()
});

// Upload profile image schema
export const uploadProfileSchema = z.object({
    usuarioId: z.string().uuid('ID de usuario inválido'),
    image: z.string().min(1, 'La imagen es requerida')
});

// Delete image schema
export const deleteImageSchema = z.object({
    url: z.string().url('URL inválida')
});
