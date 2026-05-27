import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { UserEventSettingsController } from './user-event-settings.controller';

@Module({
    controllers: [EventsController, UserEventSettingsController],
})
export class EventsModule { }
