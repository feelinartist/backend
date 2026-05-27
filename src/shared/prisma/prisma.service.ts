import { Injectable, OnModuleDestroy } from '@nestjs/common';
import prisma from '../../infrastructure/database/prisma';

@Injectable()
export class PrismaService implements OnModuleDestroy {
    client = prisma;

    async onModuleDestroy() {
        await this.client.$disconnect();
    }
}
