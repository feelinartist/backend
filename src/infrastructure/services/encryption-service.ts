import crypto from 'node:crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b'; // Must be 32 bytes
const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
    private readonly key: Buffer;

    constructor() {
        // Ensure key is exactly 32 bytes
        this.key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        // Return iv + authTag + encrypted data
        return iv.toString('hex') + ':' + authTag + ':' + encrypted;
    }

    decrypt(encryptedText: string): string {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
