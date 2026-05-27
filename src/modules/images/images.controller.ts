import { Body, Controller, Delete, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorImagenes } from '../../presentation/controllers/controlador-imagenes';
import { uploadGallerySchema, uploadProfileSchema, uploadQRSchema } from '../../domain/schemas/image.schema';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { ZodValidationPipe } from '../../shared/validation/zod-validation.pipe';

@Controller('imagenes')
@UseGuards(JwtAuthGuard)
export class ImagesController {
    private readonly controlador = new ControladorImagenes();

    @Post('galeria')
    subirImagenesGaleria(
        @Body(new ZodValidationPipe(uploadGallerySchema)) _body: unknown,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        return this.controlador.subirImagenesGaleria(req, res);
    }

    @Post('qr-pago')
    subirQRPago(
        @Body(new ZodValidationPipe(uploadQRSchema)) _body: unknown,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        return this.controlador.subirQRPago(req, res);
    }

    @Post('perfil')
    subirImagenPerfil(
        @Body(new ZodValidationPipe(uploadProfileSchema)) _body: unknown,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        return this.controlador.subirImagenPerfil(req, res);
    }

    @Delete()
    eliminarImagen(@Req() req: Request, @Res() res: Response) {
        return this.controlador.eliminarImagen(req, res);
    }
}
