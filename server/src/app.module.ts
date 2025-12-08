import { GroupsModule } from './groups/groups.module';
import { TimetableModule } from './timetable/timetable.module';
import { Module } from '@nestjs/common';
import { ModulesModule } from './modules/modules.module';

@Module({
  imports: [GroupsModule, TimetableModule, ModulesModule],
})
export class AppModule {}
