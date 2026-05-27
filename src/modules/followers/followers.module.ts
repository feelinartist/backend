import { Module } from '@nestjs/common';
import { FollowersController } from './followers.controller';

@Module({
    controllers: [FollowersController],
})
export class FollowersModule { }
