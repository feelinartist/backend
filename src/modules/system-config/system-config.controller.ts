import { Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorConfigSistema } from '../../presentation/controllers/controlador-config-sistema';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';

@Controller('admin/config-sistema')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class SystemConfigController {
    private readonly controlador = new ControladorConfigSistema();

    @Get()
    listarTodas(@Req() req: Request, @Res() res: Response) {
        return this.controlador.listarTodas(req, res);
    }

    @Get(':clave')
    obtenerPorClave(@Param('clave') _clave: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerPorClave(req, res);
    }

    @Post()
    crear(@Req() req: Request, @Res() res: Response) {
        return this.controlador.crear(req, res);
    }

    @Patch(':id')
    actualizar(@Param('id') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.actualizar(req, res);
    }

    @Delete(':id')
    eliminar(@Param('id') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.eliminar(req, res);
    }
}
