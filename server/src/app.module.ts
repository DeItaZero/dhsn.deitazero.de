import { TelegramModule } from './telegram/telegram.module';
import { GroupsModule } from './groups/groups.module';
import { TimetableModule } from './timetable/timetable.module';
import { Module } from '@nestjs/common';
import { ModulesModule } from './modules/modules.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TelegramModule,
    GroupsModule,
    TimetableModule,
    ModulesModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
