import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';


export class LocalFileService {
    private readonly uploadDir: string;
    private readonly baseUrl: string;

    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads');
        // Asegurarse de que el directorio base exista
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }

        const port = process.env.PORT || 3001;
        // Construct base URL based on config or default localhost
        const host = process.env.BACKEND_HOST || 'localhost';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

        // Use environment variable if set (e.g. for production URL)
        this.baseUrl = process.env.BACKEND_URL || `${protocol}://${host}:${port}`;
    }

    /**
     * Upload base64 image to local storage converted to WebP
     * @param base64Image - Base64 encoded image
     * @param userId - ID of the user (owner of the image)
     * @param type - Type of image (gallery, payment, profile)
     * @param filename - Optional custom filename (without extension)
     */
    async uploadBase64Image(base64Image: string, userId: string, type: 'gallery' | 'payment' | 'profile' | 'music', filename?: string): Promise<{ url: string; publicId: string }> {
        try {
            // 1. Remove header data:image/jpeg;base64,
            const regexHeader = /^data:([A-Za-z-+/]+);base64,(.+)$/;
            const matches = regexHeader.exec(base64Image);

            if (matches?.length !== 3) {
                // If no header, assume raw base64
                const regexBase64 = /^[A-Za-z0-9+/=]+$/;
                if (!regexBase64.exec(base64Image)) {
                    throw new Error('Invalid base64 string');
                }
            }

            const imageBuffer = Buffer.from(matches ? matches[2] : base64Image, 'base64');

            // 2. Create directory: uploads/users/{userId}/{type}
            const userDir = path.join(this.uploadDir, 'users', userId, type);
            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir, { recursive: true });
            }

            // 3. Generate filename
            const finalFilename = filename || `${type}_${Date.now()}`;
            const filePath = path.join(userDir, `${finalFilename}.webp`);

            // 4. Convert to WebP and save
            await sharp(imageBuffer)
                .webp({ quality: 80 })
                .toFile(filePath);

            // 5. Construct URL (Relative path)
            // URL format: /uploads/users/{userId}/{type}/{filename}.webp
            const url = `/uploads/users/${userId}/${type}/${finalFilename}.webp`;

            // Generate a psuedo-publicId for compatibility
            const publicId = `users/${userId}/${type}/${finalFilename}`;

            return { url, publicId };

        } catch (error) {
            console.error('Error saving local image:', error);
            throw new Error('Error al guardar la imagen localmente');
        }
    }

    /**
     * Delete an image from local storage
     * @param publicId - Relative path or identifier (e.g. users/123/profile/abc)
     */
    async deleteImage(publicId: string): Promise<void> {
        try {
            // Prevent directory traversal attacks
            const safePath = path.normalize(publicId).replace(/^(\.\.[/\\])+/, '');
            const filePath = path.join(this.uploadDir, safePath + '.webp');

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            } else {
                // Try finding it without appending .webp if it was passed with extension
                const filePathWithExt = path.join(this.uploadDir, safePath);
                if (fs.existsSync(filePathWithExt)) {
                    fs.unlinkSync(filePathWithExt);
                }
            }
        } catch (error) {
            console.error('Error deleting local image:', error);
            throw new Error('Error al eliminar la imagen local');
        }
    }

    /**
     * Delete multiple images
     */
    async deleteImages(publicIds: string[]): Promise<void> {
        for (const id of publicIds) {
            await this.deleteImage(id);
        }
    }
}
