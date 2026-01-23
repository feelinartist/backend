import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { Usuario } from '../../domain/entities/user';


import { LocalFileService } from '../../infrastructure/services/local-file-service';
import { QrService } from '../../infrastructure/services/qr-service';
import { configService } from '../../infrastructure/services/config-service';

export class ActualizarRolUsuarioCasoUso {
    private localFileService: LocalFileService;
    private qrService: QrService;

    constructor(private repositorioUsuario: RepositorioUsuario) {
        this.localFileService = new LocalFileService();
        this.qrService = new QrService();
    }

    async ejecutar(correo: string, nombreRol: string, datosPerfilArtista?: Record<string, unknown>, datosPerfilPublico?: Record<string, unknown>, datosDiscoteca?: Record<string, unknown>, nombreUsuario?: string, nombre?: string): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorCorreo(correo);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        if (nombreRol === 'ARTISTA') {
            try {
                const username = nombreUsuario || usuario.nombreUsuario;
                if (username) {
                    const frontendUrl = await configService.get('FRONTEND_URL', 'http://localhost:3000');
                    const profileUrl = `${frontendUrl}/artist/${username}/music`;
                    const qrBuffer = await this.qrService.generateQrCode(profileUrl);

                    // Convert buffer to base64
                    const qrBase64 = `data:image/png;base64,${qrBuffer.toString('base64')}`;

                    // Use organized folder structure: uploads/users/{userId}/music/qr.webp
                    // This is the "Scan for Music" QR.
                    const result = await this.localFileService.uploadBase64Image(qrBase64, usuario.id, 'music', 'qr');
                    const qrUrl = result.url;

                    if (!datosPerfilArtista) datosPerfilArtista = {};
                    datosPerfilArtista.musicQR = qrUrl;   // New field name in Prisma
                }
            } catch (error) {
                console.error('Error generating/uploading QR code:', error);
                // Continue without QR if it fails to avoid blocking registration on external service failure
            }
        }

        const updateData: Record<string, unknown> = {
            rol: nombreRol,
            perfilArtista: datosPerfilArtista,
            perfilPublico: datosPerfilPublico,
            nombreUsuario: nombreUsuario,
            nombre: nombre
        };

        if (nombreRol === 'DISCOTECA' && datosDiscoteca) {
            updateData.perfilDiscoteca = {
                ciudad: datosDiscoteca.ciudad,
                pais: datosDiscoteca.pais,
                fechaFundacion: datosDiscoteca.fechaFundacion ? new Date(datosDiscoteca.fechaFundacion as string) : undefined,
                codigoTelefono: datosDiscoteca.codigoTelefono,
                numeroTelefono: datosDiscoteca.numeroTelefono,
                zonaHoraria: datosDiscoteca.zonaHoraria
            };
        } else {
            updateData.perfilDiscoteca = undefined; // Or keep existing if not updating to DISCOTECA
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.repositorioUsuario.actualizar(usuario.id, updateData as any);
    }
}
