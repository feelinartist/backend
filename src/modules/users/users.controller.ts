import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorUsuario } from '../../presentation/controllers/controlador-usuario';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { ZodValidationPipe } from '../../shared/validation/zod-validation.pipe';
import { blockUserSchema, updateProfileSchema, updateRoleSchema, usernameCheckSchema } from '../../domain/schemas/user.schema';

@Controller('usuarios')
export class UsersController {
    private readonly controlador = new ControladorUsuario();

    @Get('perfil-publico/:username')
    obtenerPerfilPublico(@Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerPerfilPublico(req, res);
    }

    @Get('buscar')
    @UseGuards(JwtAuthGuard)
    buscarArtistas(@Req() req: Request, @Res() res: Response) {
        return this.controlador.buscarArtistas(req, res);
    }

    @Get('perfil/:usuarioId')
    @UseGuards(JwtAuthGuard)
    obtenerPerfil(@Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerPerfil(req, res);
    }

    @Patch('rol')
    @UseGuards(JwtAuthGuard)
    actualizarRol(
        @Body(new ZodValidationPipe(updateRoleSchema)) _body: unknown,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        return this.controlador.actualizarRol(req, res);
    }

    @Patch('perfil')
    @UseGuards(JwtAuthGuard)
    actualizarPerfil(
        @Body(new ZodValidationPipe(updateProfileSchema)) _body: unknown,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        return this.controlador.actualizarPerfil(req, res);
    }

    @Post('verificar-nombre-usuario')
    @UseGuards(JwtAuthGuard)
    verificarNombreUsuario(
        @Body(new ZodValidationPipe(usernameCheckSchema)) _body: unknown,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        return this.controlador.verificarNombreUsuario(req, res);
    }

    @Post('marcar-perfil-completado')
    @UseGuards(JwtAuthGuard)
    marcarPerfilCompletadoReconocido(@Req() req: Request, @Res() res: Response) {
        return this.controlador.marcarPerfilCompletadoReconocido(req, res);
    }

    @Patch('deshabilitar')
    @UseGuards(JwtAuthGuard)
    deshabilitarCuenta(@Req() req: Request, @Res() res: Response) {
        return this.controlador.deshabilitarCuenta(req, res);
    }

    @Delete('eliminar')
    @UseGuards(JwtAuthGuard)
    eliminarCuenta(@Req() req: Request, @Res() res: Response) {
        return this.controlador.eliminarCuenta(req, res);
    }

    @Patch('reactivar')
    @UseGuards(JwtAuthGuard)
    reactivarCuenta(@Req() req: Request, @Res() res: Response) {
        return this.controlador.reactivarCuenta(req, res);
    }

    @Post('bloquear')
    @UseGuards(JwtAuthGuard)
    bloquearUsuario(
        @Body(new ZodValidationPipe(blockUserSchema)) _body: unknown,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        return this.controlador.bloquearUsuario(req, res);
    }

    @Post('desbloquear')
    @UseGuards(JwtAuthGuard)
    desbloquearUsuario(
        @Body(new ZodValidationPipe(blockUserSchema)) _body: unknown,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        return this.controlador.desbloquearUsuario(req, res);
    }

    @Get('bloqueados/:bloqueadorId')
    @UseGuards(JwtAuthGuard)
    obtenerBloqueados(@Param('bloqueadorId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerBloqueados(req, res);
    }

    @Post('migrar-rol')
    @UseGuards(JwtAuthGuard)
    migrarRol(@Req() req: Request, @Res() res: Response) {
        return this.controlador.migrarRol(req, res);
    }

    @Post('banear')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    banearUsuario(@Req() req: Request, @Res() res: Response) {
        return this.controlador.banearUsuario(req, res);
    }

    @Delete('eliminar-permanente')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    eliminarPermanente(@Req() req: Request, @Res() res: Response) {
        return this.controlador.eliminarPermanente(req, res);
    }
}
