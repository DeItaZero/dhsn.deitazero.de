import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CampusdualModule } from './campusdual/campusdual.module';
import { GroupsModule } from './groups/groups.module';
import { ModulesModule } from './modules/modules.module';
import { TelegramModule } from './telegram/telegram.module';
import { TimerModule } from './timer/timer.module';
import { TimetableModule } from './timetable/timetable.module';

@Module({
  imports: [
    TimerModule,
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
