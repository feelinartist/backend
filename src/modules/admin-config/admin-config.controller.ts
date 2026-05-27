import { Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorAdminConfig } from '../../presentation/controllers/controlador-admin-config';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';

@Controller()
export class AdminConfigController {
    private readonly controlador = new ControladorAdminConfig();

    @Get('config/redes-sociales')
    listarRedesSociales(@Req() req: Request, @Res() res: Response) {
        return this.controlador.listarRedesSociales(req, res);
    }

    @Get('config/metodos-donacion')
    listarMetodosDonacion(@Req() req: Request, @Res() res: Response) {
        return this.controlador.listarMetodosDonacion(req, res);
    }

    @Post('admin/config/redes-sociales')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    crearRedSocial(@Req() req: Request, @Res() res: Response) {
        return this.controlador.crearRedSocial(req, res);
    }

    @Patch('admin/config/redes-sociales/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    actualizarRedSocial(@Param('id') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.actualizarRedSocial(req, res);
    }

    @Delete('admin/config/redes-sociales/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    eliminarRedSocial(@Param('id') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.eliminarRedSocial(req, res);
    }

    @Post('admin/config/metodos-donacion')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    crearMetodoDonacion(@Req() req: Request, @Res() res: Response) {
        return this.controlador.crearMetodoDonacion(req, res);
    }

    @Patch('admin/config/metodos-donacion/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    actualizarMetodoDonacion(@Param('id') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.actualizarMetodoDonacion(req, res);
    }

    @Delete('admin/config/metodos-donacion/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    eliminarMetodoDonacion(@Param('id') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.eliminarMetodoDonacion(req, res);
    }

    @Get('admin/config/roles')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    listarRoles(@Req() req: Request, @Res() res: Response) {
        return this.controlador.listarRoles(req, res);
    }
}
