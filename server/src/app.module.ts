import { CampusdualModule } from './campusdual/campusdual.module';
import { TelegramModule } from './telegram/telegram.module';
import { GroupsModule } from './groups/groups.module';
import { TimetableModule } from './timetable/timetable.module';
import { Module } from '@nestjs/common';
import { ModulesModule } from './modules/modules.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';

@Module({
  imports: [
    CampusdualModule,
    TelegramModule,
    GroupsModule,
    TimetableModule,
    ModulesModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
