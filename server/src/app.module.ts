import { TimetableModule } from './timetable/timetable.module';
import { Module } from '@nestjs/common';
import { ModulesModule } from './modules/modules.module';

@Module({
  imports: [TimetableModule, ModulesModule],
})
export class AppModule {}
