import { Module } from '@nestjs/common';
import { UsersAdminController } from './users-admin.controller';
import { UsersController } from './users.controller';
import { UsersPublicController } from './users-public.controller';

@Module({
    controllers: [UsersController, UsersPublicController, UsersAdminController],
})
export class UsersModule { }
