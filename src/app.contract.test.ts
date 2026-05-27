import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, it, vi } from 'vitest';

vi.mock('./infrastructure/database/prisma', () => {
    return {
        default: {
            $disconnect: vi.fn(),
        }
    };
});

import { AppModule } from './app.module';

describe('NestJS route contract', () => {
    it('serves the health endpoint under the existing /api prefix', async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        const app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();

        await (request(app.getHttpServer())
            .get('/api/health')
            .expect(200)
            .expect({ status: 'ok' }) as unknown as Promise<any>);

        await app.close();
    });
});
