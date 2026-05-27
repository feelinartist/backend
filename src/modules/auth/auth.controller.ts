import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorAutenticacion } from '../../presentation/controllers/controlador-autenticacion';

@Controller('auth')
export class AuthController {
    private readonly controlador = new ControladorAutenticacion();

    @Post('login')
    iniciarSesion(@Req() req: Request, @Res() res: Response) {
        return this.controlador.iniciarSesion(req, res);
    }
}
