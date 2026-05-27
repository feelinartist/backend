import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorSeguidor } from '../../presentation/controllers/controlador-seguidor';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class FollowersController {
    private readonly controlador = new ControladorSeguidor();

    @Post('seguir')
    seguir(@Req() req: Request, @Res() res: Response) {
        return this.controlador.seguir(req, res);
    }

    @Post('dejar-de-seguir')
    dejarDeSeguir(@Req() req: Request, @Res() res: Response) {
        return this.controlador.dejarDeSeguir(req, res);
    }
}
