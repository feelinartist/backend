import { PrismaClient } from "@prisma/client";
import { EncryptionService } from "../services/encryption-service";

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();

interface ConfiguracionDTO {
    clave: string;
    valor: string;
    descripcion?: string;
    creadoPor?: string;
}

export class PrismaConfigSistemaRepository {
    async obtenerTodas() {
        const configs = await prisma.configuracionSistema.findMany({
            orderBy: { clave: 'asc' }
        });

        // Decrypt ALL values (try-catch because some might be plain text)
        return configs.map(config => {
            try {
                return {
                    ...config,
                    valor: encryptionService.decrypt(config.valor)
                };
            } catch {
                // If decryption fails, assume it's plain text (e.g. URLs)
                return config;
            }
        });
    }

    async obtenerPorClave(clave: string) {
        const config = await prisma.configuracionSistema.findUnique({
            where: { clave }
        });

        if (!config) return null;

        return {
            ...config,
            valor: encryptionService.decrypt(config.valor)
        };
    }

    async crear(data: ConfiguracionDTO) {
        // Encrypt ALL values
        const valorEncriptado = encryptionService.encrypt(data.valor);

        return await prisma.configuracionSistema.create({
            data: {
                clave: data.clave,
                valor: valorEncriptado,
                descripcion: data.descripcion,
                creadoPor: data.creadoPor
            }
        });
    }

    async actualizar(id: string, valor: string, actualizadoPor?: string) {
        // Encrypt ALL values
        const valorEncriptado = encryptionService.encrypt(valor);

        return await prisma.configuracionSistema.update({
            where: { id },
            data: {
                valor: valorEncriptado,
                actualizadoPor
            }
        });
    }

    async eliminar(id: string) {
        return await prisma.configuracionSistema.delete({
            where: { id }
        });
    }

    // Helper method to get decrypted value by key (for internal use)
    async obtenerValor(clave: string): Promise<string | null> {
        const config = await this.obtenerPorClave(clave);
        return config?.valor || null;
    }
}
