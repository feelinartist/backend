import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorEstadisticas } from '../../presentation/controllers/controlador-estadisticas';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller('estadisticas')
export class StatisticsController {
    private readonly controlador = new ControladorEstadisticas();

    @Get('evento/:eventoId')
    obtenerEstadisticasEvento(@Param('eventoId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerEstadisticasEvento(req, res);
    }

    @Get('evento/:eventoId/canciones')
    obtenerDetalleCancionesEvento(@Param('eventoId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerDetalleCancionesEvento(req, res);
    }

    @Get('artista/:perfilArtistaId')
    @UseGuards(JwtAuthGuard)
    obtenerEstadisticasArtista(@Param('perfilArtistaId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerEstadisticasArtista(req, res);
    }

    @Get('artista/:perfilArtistaId/generos')
    @UseGuards(JwtAuthGuard)
    obtenerGenerosArtista(@Param('perfilArtistaId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerGenerosArtista(req, res);
    }

    @Get('artista/:perfilArtistaId/top-canciones')
    @UseGuards(JwtAuthGuard)
    obtenerTopCanciones(@Param('perfilArtistaId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerTopCanciones(req, res);
    }

    @Get('artista/:perfilArtistaId/canciones')
    @UseGuards(JwtAuthGuard)
    obtenerDetalleCancionesArtista(@Param('perfilArtistaId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerDetalleCancionesArtista(req, res);
    }
}
