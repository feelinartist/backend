import { RepositorioUsuario } from "../../domain/repositories/user-repository";
import { Usuario, ActualizarUsuarioDTO } from "../../domain/entities/user";
import { LocalFileService } from "../../infrastructure/services/local-file-service";
import { QrService } from "../../infrastructure/services/qr-service";
import { configService } from "../../infrastructure/services/config-service";

interface ActualizarUsuarioRequest {
    usuarioId: string;
    nombre?: string;
    nombreUsuario?: string;
    imagen?: string;
    nombreArtistico?: string;
    telefono?: string;
    rol?: string;
    estadoCuenta?: unknown;
}

export class ActualizarUsuarioCasoUso {
    private localFileService: LocalFileService;
    private qrService: QrService;

    constructor(private repositorioUsuario: RepositorioUsuario) {
        this.localFileService = new LocalFileService();
        this.qrService = new QrService();
    }

    async ejecutar(dto: ActualizarUsuarioRequest & {
        pais?: string;
        ciudad?: string;
        zonaHoraria?: string;
        // telefono?: string; // Moved to ActualizarUsuarioRequest
        codigoTelefono?: string;
        redesSociales?: Record<string, unknown>[];
        metodosDonacion?: Record<string, unknown>[];
        galeria?: string[];
        biografia?: string;
        categoria?: string;
        tarifaPorHora?: number;
        moneda?: string;
        lugaresConocidos?: string[];
        fechaInicio?: Date | string;
        fechaFundacion?: Date | string;
        pagoQR?: string;
        musicQR?: string;
        nombreQR?: string;
        urlPago?: string;
        urlYoutubeFavorito?: string;
        urlSoundCloudFavorito?: string;
    }): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorId(dto.usuarioId);
        if (!usuario) {
            throw new Error("Usuario no encontrado");
        }

        const esAdmin = usuario.rol?.nombre === 'ADMIN' || usuario.rol?.nombre === 'SUPERADMIN';
        const ahora = new Date();
        const dias30 = 30 * 24 * 60 * 60 * 1000;
        const dias7 = 7 * 24 * 60 * 60 * 1000;

        const datosActualizacion: ActualizarUsuarioDTO = {
            rol: dto.rol,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            estadoCuenta: dto.estadoCuenta as any // Casting to any to satisfy type but variable is unknown from request
        };

        // Validar cambio de nombre de usuario (30 días) - Bypass for Admins
        if (dto.nombreUsuario && dto.nombreUsuario !== usuario.nombreUsuario) {
            if (!esAdmin && usuario.ultimoCambioNombreUsuario) {
                const tiempoTranscurrido = ahora.getTime() - usuario.ultimoCambioNombreUsuario.getTime();
                if (tiempoTranscurrido < dias30) {
                    const diasRestantes = Math.ceil((dias30 - tiempoTranscurrido) / (24 * 60 * 60 * 1000));
                    throw new Error(`Debes esperar ${diasRestantes} días para cambiar tu nombre de usuario.`);
                }
            }
            // Verificar disponibilidad
            const existe = await this.repositorioUsuario.buscarPorNombreUsuario(dto.nombreUsuario);
            if (existe && existe.id !== usuario.id) {
                throw new Error("El nombre de usuario ya está en uso.");
            }
            datosActualizacion.nombreUsuario = dto.nombreUsuario;
            datosActualizacion.ultimoCambioNombreUsuario = ahora;
        }

        // Validar cambio de nombre visible (7 días) - Bypass for Admins
        if (dto.nombre && dto.nombre !== usuario.nombre) {
            if (!esAdmin && usuario.ultimoCambioNombre) {
                const tiempoTranscurrido = ahora.getTime() - usuario.ultimoCambioNombre.getTime();
                if (tiempoTranscurrido < dias7) {
                    const diasRestantes = Math.ceil((dias7 - tiempoTranscurrido) / (24 * 60 * 60 * 1000));
                    throw new Error(`Debes esperar ${diasRestantes} días para cambiar tu nombre visible.`);
                }
            }
            datosActualizacion.nombre = dto.nombre;
            datosActualizacion.ultimoCambioNombre = ahora;
        }

        // Update Profile Fields
        if (usuario.perfilArtista) {
            datosActualizacion.perfilArtista = {
                ...(dto.pais && { pais: dto.pais }),
                ...(dto.ciudad && { ciudad: dto.ciudad }),
                ...(dto.zonaHoraria && { zonaHoraria: dto.zonaHoraria }),
                ...(dto.telefono && { numeroTelefono: dto.telefono }),
                ...(dto.codigoTelefono && { codigoTelefono: dto.codigoTelefono }),
                ...(dto.redesSociales && { redesSociales: dto.redesSociales }),
                ...(dto.metodosDonacion && { metodosDonacion: dto.metodosDonacion }),
                ...(dto.galeria && { galeria: dto.galeria }),
                ...(dto.biografia !== undefined && { biografia: dto.biografia }),
                ...(dto.categoria && { categoria: dto.categoria }),
                ...(dto.tarifaPorHora !== undefined && { tarifaPorHora: dto.tarifaPorHora }),
                ...(dto.moneda && { moneda: dto.moneda }),
                ...(dto.lugaresConocidos && { lugaresConocidos: dto.lugaresConocidos }),
                ...(dto.fechaInicio && { fechaInicio: new Date(dto.fechaInicio) }),
                ...(dto.pagoQR !== undefined && { pagoQR: dto.pagoQR }),   // Renamed from imagenQR
                ...(dto.musicQR !== undefined && { musicQR: dto.musicQR }), // Renamed from codigoQR
                ...(dto.nombreQR !== undefined && { nombreQR: dto.nombreQR }),
                ...(dto.urlPago !== undefined && { urlPago: dto.urlPago }),
                ...(dto.urlYoutubeFavorito !== undefined && { urlYoutubeFavorito: dto.urlYoutubeFavorito }),
                ...(dto.urlSoundCloudFavorito !== undefined && { urlSoundCloudFavorito: dto.urlSoundCloudFavorito }),
            };

            // 🎵 Regenerate musicQR if username changed
            if (datosActualizacion.nombreUsuario && datosActualizacion.nombreUsuario !== usuario.nombreUsuario) {
                try {
                    const frontendUrl = await configService.get('FRONTEND_URL', 'http://localhost:3000');
                    const profileUrl = `${frontendUrl}/artist/${datosActualizacion.nombreUsuario}/music`;
                    const qrBuffer = await this.qrService.generateQrCode(profileUrl);
                    const qrBase64 = `data:image/png;base64,${qrBuffer.toString('base64')}`;

                    const result = await this.localFileService.uploadBase64Image(qrBase64, usuario.id, 'music', 'qr');
                    datosActualizacion.perfilArtista.musicQR = result.url;
                } catch (error) {
                    console.error("Error regenerating Music QR on username change:", error);
                }
            }
        } else if (usuario.perfilPublico) {
            datosActualizacion.perfilPublico = {
                ...(dto.pais && { pais: dto.pais }),
                ...(dto.ciudad && { ciudad: dto.ciudad }),
                ...(dto.zonaHoraria && { zonaHoraria: dto.zonaHoraria }),
                ...(dto.telefono && { numeroTelefono: dto.telefono }),
                ...(dto.codigoTelefono && { codigoTelefono: dto.codigoTelefono }),
            };
        } else if (usuario.perfilDiscoteca) {
            datosActualizacion.perfilDiscoteca = {
                ...(dto.pais && { pais: dto.pais }),
                ...(dto.ciudad && { ciudad: dto.ciudad }),
                ...(dto.zonaHoraria && { zonaHoraria: dto.zonaHoraria }),
                ...(dto.telefono && { numeroTelefono: dto.telefono }),
                ...(dto.codigoTelefono && { codigoTelefono: dto.codigoTelefono }),
                ...(dto.fechaFundacion && { fechaFundacion: new Date(dto.fechaFundacion) }),
            };
        } else {
            // If no profile exists (e.g., Admin created via seed/backend), create a default Public Profile
            datosActualizacion.perfilPublico = {
                pais: dto.pais,
                ciudad: dto.ciudad,
                zonaHoraria: dto.zonaHoraria,
                numeroTelefono: dto.telefono,
                codigoTelefono: dto.codigoTelefono,
                imagen: dto.imagen,
            };
        }

        return this.repositorioUsuario.actualizar(usuario.id, datosActualizacion);
    }
}
