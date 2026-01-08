import { Module } from '@nestjs/common';
import { TimerController } from './timer.controller';
import { TimetableService } from '../timetable/timetable.service';

@Module({
  imports: [],
  controllers: [TimerController],
  providers: [TimetableService],
  exports: [],
})
export class TimerModule {}
