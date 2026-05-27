import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';

@Module({
    controllers: [StatisticsController],
})
export class StatisticsModule { }
