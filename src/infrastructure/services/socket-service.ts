import { Server } from 'socket.io';

export class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(io: Server): void {
        this.io = io;
    }

    public getIO(): Server {
        if (!this.io) {
            throw new Error('Socket.io not initialized!');
        }
        return this.io;
    }
}
