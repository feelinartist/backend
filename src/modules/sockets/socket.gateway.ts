import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from '../../infrastructure/services/socket-service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    afterInit(server: Server) {
        SocketService.getInstance().init(server);
    }

    handleConnection(socket: Socket) {
        console.log('Client connected:', socket.id);
    }

    handleDisconnect(socket: Socket) {
        console.log('Client disconnected:', socket.id);
    }

    @SubscribeMessage('join_event')
    joinEvent(socket: Socket, eventId: string) {
        console.log(`Socket ${socket.id} joining room event:${eventId}`);
        socket.join(`event:${eventId}`);
    }

    @SubscribeMessage('join_artist')
    joinArtist(socket: Socket, artistId: string) {
        console.log(`Socket ${socket.id} joining room artist:${artistId}`);
        socket.join(`artist:${artistId}`);
    }
}
