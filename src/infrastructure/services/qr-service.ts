import QRCode from 'qrcode';

export class QrService {
    async generateQrCode(text: string): Promise<Buffer> {
        try {
            // Generate QR code as a Buffer
            // Generate QR code as a Buffer with higher resolution
            const qrBuffer = await QRCode.toBuffer(text, { width: 500, margin: 2 });
            return qrBuffer;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }
}
