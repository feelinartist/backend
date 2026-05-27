import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PrismaModule } from './shared/prisma/prisma.module';
import { StatsSyncProvider } from './shared/background/stats-sync.provider';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminConfigModule } from './modules/admin-config/admin-config.module';
import { PublicConfigModule } from './modules/public-config/public-config.module';
import { OrdersModule } from './modules/orders/orders.module';
import { EventsModule } from './modules/events/events.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { FollowersModule } from './modules/followers/followers.module';
import { ImagesModule } from './modules/images/images.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { SocketsModule } from './modules/sockets/sockets.module';
import { authLimiter, uploadLimiter } from './middleware/rate-limit';

@Module({
    imports: [
        PrismaModule,
        HealthModule,
        AuthModule,
        UsersModule,
        AdminConfigModule,
        PublicConfigModule,
        OrdersModule,
        EventsModule,
        StatisticsModule,
        FollowersModule,
        ImagesModule,
        SystemConfigModule,
        SocketsModule,
    ],
    providers: [StatsSyncProvider],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(authLimiter)
            .forRoutes(
                { path: 'auth/login', method: RequestMethod.POST },
                { path: 'usuarios/rol', method: RequestMethod.PATCH },
            );

        consumer
            .apply(uploadLimiter)
            .forRoutes(
                { path: 'imagenes/galeria', method: RequestMethod.POST },
                { path: 'imagenes/qr-pago', method: RequestMethod.POST },
                { path: 'imagenes/perfil', method: RequestMethod.POST },
            );
    }
}
