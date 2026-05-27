import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorConfigPublica } from '../../presentation/controllers/controlador-config-publica';

@Controller('internal/config')
export class PublicConfigController {
    private readonly controlador = new ControladorConfigPublica();

    @Get('auth')
    obtenerCredencialesAuth(@Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerCredencialesAuth(req, res);
    }
}
