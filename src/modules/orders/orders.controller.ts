import { Controller, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ControladorPedido } from '../../presentation/controllers/controlador-pedido';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller()
export class OrdersController {
    private readonly controlador = new ControladorPedido();

    @Post('pedidos')
    crearPedido(@Req() req: Request, @Res() res: Response) {
        return this.controlador.crearPedido(req, res);
    }

    @Get('eventos/:eventoId/pedidos')
    @UseGuards(JwtAuthGuard)
    obtenerPedidosPorEvento(@Param('eventoId') _eventoId: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.obtenerPedidosPorEvento(req, res);
    }

    @Patch('pedidos/:id/estado')
    @UseGuards(JwtAuthGuard)
    actualizarEstado(@Param('id') _id: string, @Req() req: Request, @Res() res: Response) {
        return this.controlador.actualizarEstado(req, res);
    }
}
