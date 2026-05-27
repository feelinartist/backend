import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { AppModule } from './app.module';
import { generalLimiter } from './middleware/rate-limit';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    app.setGlobalPrefix('api');
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.enableCors({
        origin: frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.use('/api', generalLimiter);
    app.use(json({ limit: '50mb' }));
    app.useStaticAssets(path.join(process.cwd(), 'uploads'), { prefix: '/uploads' });

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Server running on port ${port}`);
    console.log(`CORS origin: ${frontendUrl}`);
}

bootstrap().catch((error) => {
    console.error('Error starting server:', error);
    process.exit(1);
});
