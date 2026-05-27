import { Controller, Delete, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorUsuario } from '../../presentation/controllers/controlador-usuario';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Roles } from '../../shared/auth/roles.decorator';

@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class UsersAdminController {
    private readonly controlador = new ControladorUsuario();

    @Get()
    listarUsuarios(@Req() req: Request, @Res() res: Response) {
        return this.controlador.listarUsuarios(req, res);
    }

    @Delete('perfil/:tipo')
    eliminarPerfilEspecifico(@Param('tipo') _tipo: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.eliminarPerfilEspecifico(req, res);
    }
}
