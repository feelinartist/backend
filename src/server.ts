import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import routes from './presentation/routes';
import { SocketService } from './infrastructure/services/socket-service';
import { statsSyncService } from './infrastructure/services/stats-sync-service';
import { generalLimiter } from './middleware/rate-limit';

const app = express();
const httpServer = createServer(app);

// Inicialización asíncrona del servidor
async function startServer() {
    // Cargar FRONTEND_URL de variables de entorno
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Start Stats Sync Service (Background Worker)
    statsSyncService.start();

    // Configurar Socket.IO con la URL del frontend
    const io = new Server(httpServer, {
        cors: {
            origin: frontendUrl,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            credentials: true
        }
    });

    // Initialize Socket Service
    SocketService.getInstance().init(io);

    // Security: Helmet for security headers
    app.use(helmet({
        contentSecurityPolicy: false, // Disable CSP for now (can be configured later)
        crossOriginEmbedderPolicy: false // Allow embedding for development
    }));

    // Security: Restrictive CORS
    app.use(cors({
        origin: frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Security: Rate limiting
    app.use('/api', generalLimiter);

    app.use(express.json({ limit: '50mb' }));

    // Serve static files from uploads directory
    // Maps http://host:port/uploads -> /path/to/project/uploads
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    app.use('/api', routes);

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join_event', (eventId) => {
            console.log(`Socket ${socket.id} joining room event:${eventId}`);
            socket.join(`event:${eventId}`);
        });

        socket.on('join_artist', (artistId) => {
            console.log(`Socket ${socket.id} joining room artist:${artistId}`);
            socket.join(`artist:${artistId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    const PORT = process.env.PORT || 3001;

    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`CORS origin: ${frontendUrl}`);
    });
}

// Iniciar el servidor
startServer().catch((error) => {
    console.error('Error starting server:', error);
    process.exit(1);
});
