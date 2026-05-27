import { Request, Response } from 'express';
import { LocalFileService } from '../../infrastructure/services/local-file-service';

const imageService = new LocalFileService();

export class ControladorImagenes {
    /**
     * Upload gallery images for an artist
     * POST /api/imagenes/galeria
     * Body: { usuarioId: string, images: string[] } // base64 images
     */
    async subirImagenesGaleria(req: Request, res: Response) {
        try {
            const { usuarioId, images } = req.body;

            if (!usuarioId || !images || !Array.isArray(images)) {
                return res.status(400).json({ message: 'Datos inválidos' });
            }

            const uploadedImages = [];

            for (let i = 0; i < images.length; i++) {
                const result = await imageService.uploadBase64Image(
                    images[i],
                    usuarioId,
                    'gallery',
                    `image_${Date.now()}_${i}`
                );
                uploadedImages.push(result.url);
            }

            res.json({ urls: uploadedImages });
        } catch (error) {
            console.error('Error uploading gallery images:', error);
            res.status(500).json({ message: (error as Error).message || 'Error al subir las imágenes' });
        }
    }

    /**
     * Upload payment QR for an artist
     * POST /api/imagenes/qr-pago
     * Body: { usuarioId: string, image: string } // base64 image
     */
    async subirQRPago(req: Request, res: Response) {
        try {
            const { usuarioId, image } = req.body;

            if (!usuarioId || !image) {
                return res.status(400).json({ message: 'Datos inválidos' });
            }

            const result = await imageService.uploadBase64Image(
                image,
                usuarioId,
                'payment',
                'qr_payment'
            );

            res.json({ url: result.url });
        } catch (error) {
            console.error('Error uploading payment QR:', error);
            res.status(500).json({ message: (error as Error).message || 'Error al subir el QR' });
        }
    }

    /**
     * Upload profile picture
     * POST /api/imagenes/perfil
     * Body: { usuarioId: string, image: string } // base64 image
     */
    async subirImagenPerfil(req: Request, res: Response) {
        try {
            const { usuarioId, image } = req.body;

            if (!usuarioId || !image) {
                return res.status(400).json({ message: 'Datos inválidos' });
            }

            const result = await imageService.uploadBase64Image(
                image,
                usuarioId,
                'profile',
                `profile_${Date.now()}`
            );

            res.json({ url: result.url });
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            res.status(500).json({ message: (error as Error).message || 'Error al subir la foto de perfil' });
        }
    }

    /**
     * Delete an image
     * DELETE /api/imagenes
     * Body: { publicId: string }
     */
    async eliminarImagen(req: Request, res: Response) {
        try {
            const { publicId } = req.body;

            if (!publicId) {
                return res.status(400).json({ message: 'Public ID (path relativo) requerido' });
            }

            await imageService.deleteImage(publicId);
            res.json({ message: 'Imagen eliminada correctamente' });
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({ message: (error as Error).message || 'Error al eliminar la imagen' });
        }
    }
}
