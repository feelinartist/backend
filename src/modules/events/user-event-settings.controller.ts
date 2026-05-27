import { Controller, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorEvento } from '../../presentation/controllers/controlador-evento';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller('usuarios/perfil')
export class UserEventSettingsController {
    private readonly controlador = new ControladorEvento();

    @Patch('pedidos')
    @UseGuards(JwtAuthGuard)
    togglePedidos(@Req() req: Request, @Res() res: Response) {
        return this.controlador.togglePedidos(req, res);
    }
}
