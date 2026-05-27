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
    private readonly localFileService: LocalFileService;
    private readonly qrService: QrService;

    constructor(private readonly repositorioUsuario: RepositorioUsuario) {
        this.localFileService = new LocalFileService();
        this.qrService = new QrService();
    }

    async ejecutar(dto: ActualizarUsuarioRequest & {
        pais?: string;
        ciudad?: string;
        zonaHoraria?: string;
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
        urlSoundCloudFavoriorito?: string;
        urlSoundCloudFavorito?: string;
    }): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorId(dto.usuarioId);
        if (!usuario) {
            throw new Error("Usuario no encontrado");
        }

        const esAdmin = usuario.rol?.nombre === 'ADMIN' || usuario.rol?.nombre === 'SUPERADMIN';
        const ahora = new Date();

        const datosActualizacion: ActualizarUsuarioDTO = {
            rol: dto.rol,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            estadoCuenta: dto.estadoCuenta as any
        };

        await this.validarCambioNombreUsuario(dto, usuario, esAdmin, ahora, datosActualizacion);
        this.validarCambioNombre(dto, usuario, esAdmin, ahora, datosActualizacion);
        await this.buildPerfilActualizacion(dto, usuario, datosActualizacion);

        return this.repositorioUsuario.actualizar(usuario.id, datosActualizacion);
    }

    private async validarCambioNombreUsuario(
        dto: { nombreUsuario?: string },
        usuario: Usuario,
        esAdmin: boolean,
        ahora: Date,
        datosActualizacion: ActualizarUsuarioDTO
    ): Promise<void> {
        if (dto.nombreUsuario && dto.nombreUsuario !== usuario.nombreUsuario) {
            if (!esAdmin && usuario.ultimoCambioNombreUsuario) {
                const tiempoTranscurrido = ahora.getTime() - usuario.ultimoCambioNombreUsuario.getTime();
                const dias30 = 30 * 24 * 60 * 60 * 1000;
                if (tiempoTranscurrido < dias30) {
                    const diasRestantes = Math.ceil((dias30 - tiempoTranscurrido) / (24 * 60 * 60 * 1000));
                    throw new Error(`Debes esperar ${diasRestantes} días para cambiar tu nombre de usuario.`);
                }
            }
            const existe = await this.repositorioUsuario.buscarPorNombreUsuario(dto.nombreUsuario);
            if (existe && existe.id !== usuario.id) {
                throw new Error("El nombre de usuario ya está en uso.");
            }
            datosActualizacion.nombreUsuario = dto.nombreUsuario;
            datosActualizacion.ultimoCambioNombreUsuario = ahora;
        }
    }

    private validarCambioNombre(
        dto: { nombre?: string },
        usuario: Usuario,
        esAdmin: boolean,
        ahora: Date,
        datosActualizacion: ActualizarUsuarioDTO
    ): void {
        if (dto.nombre && dto.nombre !== usuario.nombre) {
            if (!esAdmin && usuario.ultimoCambioNombre) {
                const tiempoTranscurrido = ahora.getTime() - usuario.ultimoCambioNombre.getTime();
                const dias7 = 7 * 24 * 60 * 60 * 1000;
                if (tiempoTranscurrido < dias7) {
                    const diasRestantes = Math.ceil((dias7 - tiempoTranscurrido) / (24 * 60 * 60 * 1000));
                    throw new Error(`Debes esperar ${diasRestantes} días para cambiar tu nombre visible.`);
                }
            }
            datosActualizacion.nombre = dto.nombre;
            datosActualizacion.ultimoCambioNombre = ahora;
        }
    }

    private async buildPerfilActualizacion(
        dto: any,
        usuario: Usuario,
        datosActualizacion: ActualizarUsuarioDTO
    ): Promise<void> {
        if (usuario.perfilArtista) {
            await this.buildPerfilArtista(dto, usuario, datosActualizacion);
        } else if (usuario.perfilPublico) {
            this.buildPerfilPublico(dto, datosActualizacion);
        } else if (usuario.perfilDiscoteca) {
            this.buildPerfilDiscoteca(dto, datosActualizacion);
        } else {
            this.buildPerfilDefault(dto, datosActualizacion);
        }
    }

    private mapCamposDirectosArtista(dto: any): Record<string, any> {
        const perfil: Record<string, any> = {};
        const camposDirectos = [
            { dtoKey: 'pais', dbKey: 'pais' },
            { dtoKey: 'ciudad', dbKey: 'ciudad' },
            { dtoKey: 'zonaHoraria', dbKey: 'zonaHoraria' },
            { dtoKey: 'telefono', dbKey: 'numeroTelefono' },
            { dtoKey: 'codigoTelefono', dbKey: 'codigoTelefono' },
            { dtoKey: 'redesSociales', dbKey: 'redesSociales' },
            { dtoKey: 'metodosDonacion', dbKey: 'metodosDonacion' },
            { dtoKey: 'galeria', dbKey: 'galeria' },
            { dtoKey: 'biografia', dbKey: 'biografia' },
            { dtoKey: 'categoria', dbKey: 'categoria' },
            { dtoKey: 'tarifaPorHora', dbKey: 'tarifaPorHora' },
            { dtoKey: 'moneda', dbKey: 'moneda' },
            { dtoKey: 'lugaresConocidos', dbKey: 'lugaresConocidos' },
            { dtoKey: 'pagoQR', dbKey: 'pagoQR' },
            { dtoKey: 'musicQR', dbKey: 'musicQR' },
            { dtoKey: 'nombreQR', dbKey: 'nombreQR' },
            { dtoKey: 'urlPago', dbKey: 'urlPago' },
            { dtoKey: 'urlYoutubeFavorito', dbKey: 'urlYoutubeFavorito' },
            { dtoKey: 'urlSoundCloudFavorito', dbKey: 'urlSoundCloudFavorito' }
        ];

        for (const { dtoKey, dbKey } of camposDirectos) {
            const val = dto[dtoKey];
            if (val !== undefined && val !== null) {
                perfil[dbKey] = val;
            }
        }

        if (dto.fechaInicio) {
            perfil.fechaInicio = new Date(dto.fechaInicio);
        }

        return perfil;
    }

    private async regenerarQRDeMusica(
        usuario: Usuario,
        datosActualizacion: ActualizarUsuarioDTO
    ): Promise<void> {
        if (!datosActualizacion.nombreUsuario || datosActualizacion.nombreUsuario === usuario.nombreUsuario) {
            return;
        }

        try {
            const frontendUrl = await configService.get('FRONTEND_URL', 'https://localhost:3000');
            const profileUrl = `${frontendUrl}/artist/${datosActualizacion.nombreUsuario}/music`;
            const qrBuffer = await this.qrService.generateQrCode(profileUrl);
            const qrBase64 = `data:image/png;base64,${qrBuffer.toString('base64')}`;

            const result = await this.localFileService.uploadBase64Image(qrBase64, usuario.id, 'music', 'qr');
            datosActualizacion.perfilArtista!.musicQR = result.url;
        } catch (error) {
            console.error("Error regenerating Music QR on username change:", error);
        }
    }

    private async buildPerfilArtista(
        dto: any,
        usuario: Usuario,
        datosActualizacion: ActualizarUsuarioDTO
    ): Promise<void> {
        datosActualizacion.perfilArtista = this.mapCamposDirectosArtista(dto);
        await this.regenerarQRDeMusica(usuario, datosActualizacion);
    }

    private buildPerfilPublico(dto: any, datosActualizacion: ActualizarUsuarioDTO): void {
        datosActualizacion.perfilPublico = {
            ...(dto.pais && { pais: dto.pais }),
            ...(dto.ciudad && { ciudad: dto.ciudad }),
            ...(dto.zonaHoraria && { zonaHoraria: dto.zonaHoraria }),
            ...(dto.telefono && { numeroTelefono: dto.telefono }),
            ...(dto.codigoTelefono && { codigoTelefono: dto.codigoTelefono }),
        };
    }

    private buildPerfilDiscoteca(dto: any, datosActualizacion: ActualizarUsuarioDTO): void {
        datosActualizacion.perfilDiscoteca = {
            ...(dto.pais && { pais: dto.pais }),
            ...(dto.ciudad && { ciudad: dto.ciudad }),
            ...(dto.zonaHoraria && { zonaHoraria: dto.zonaHoraria }),
            ...(dto.telefono && { numeroTelefono: dto.telefono }),
            ...(dto.codigoTelefono && { codigoTelefono: dto.codigoTelefono }),
            ...(dto.fechaFundacion && { fechaFundacion: new Date(dto.fechaFundacion) }),
        };
    }

    private buildPerfilDefault(dto: any, datosActualizacion: ActualizarUsuarioDTO): void {
        datosActualizacion.perfilPublico = {
            pais: dto.pais,
            ciudad: dto.ciudad,
            zonaHoraria: dto.zonaHoraria,
            numeroTelefono: dto.telefono,
            codigoTelefono: dto.codigoTelefono,
            imagen: dto.imagen,
        };
    }
}
