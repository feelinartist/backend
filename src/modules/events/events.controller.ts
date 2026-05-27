import { Controller, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorEvento } from '../../presentation/controllers/controlador-evento';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller('eventos')
export class EventsController {
    private readonly controlador = new ControladorEvento();

    @Get('activo/:artistaId')
    obtenerEventoActivo(@Param('artistaId') _artistaId: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerEventoActivo(req, res);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    crearEvento(@Req() req: Request, @Res() res: Response) {
        return this.controlador.crearEvento(req, res);
    }

    @Get('artista/:perfilArtistaId')
    @UseGuards(JwtAuthGuard)
    obtenerEventosPorArtista(@Param('perfilArtistaId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerEventosPorArtista(req, res);
    }

    @Get('artista/:perfilArtistaId/paginated')
    @UseGuards(JwtAuthGuard)
    obtenerEventosPaginados(@Param('perfilArtistaId') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerEventosPaginados(req, res);
    }

    @Patch(':id/finalizar')
    @UseGuards(JwtAuthGuard)
    finalizarEvento(@Param('id') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.finalizarEvento(req, res);
    }
}
