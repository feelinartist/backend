import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { statsSyncService } from '../../infrastructure/services/stats-sync-service';

@Injectable()
export class StatsSyncProvider implements OnApplicationBootstrap, OnApplicationShutdown {
    onApplicationBootstrap() {
        statsSyncService.start();
    }

    onApplicationShutdown() {
        statsSyncService.stop();
    }
}
