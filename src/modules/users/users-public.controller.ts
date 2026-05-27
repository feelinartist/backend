import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorUsuario } from '../../presentation/controllers/controlador-usuario';

@Controller()
export class UsersPublicController {
    private readonly controlador = new ControladorUsuario();

    @Get('paises')
    obtenerPaises(@Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerPaises(req, res);
    }

    @Get('ciudades/:paisId')
    obtenerCiudades(@Param('paisId') _paisId: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerCiudades(req, res);
    }
}
