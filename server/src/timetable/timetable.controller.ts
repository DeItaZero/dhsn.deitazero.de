/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import type { Timetable } from '@shared/types/timetable.types';
import { TimetableService } from './timetable.service';
import { isValidSeminarGroupId, isValidStudentId } from '../utils/validators';

@Controller('/api/timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  async getTimetable(@Query('seminarGroupId') seminarGroupId: string) {
    if (!isValidSeminarGroupId(seminarGroupId))
      throw new BadRequestException('seminar group id invalid');

    return await this.timetableService.getTimetable(seminarGroupId);
  }

  @Post()
  async postTimetable(
    @Body() timetable: Timetable,
    @Query('studentId') studentId: string,
    @Query('seminarGroupId') seminarGroupId: string,
  ) {
    if (!isValidStudentId(studentId))
      throw new BadRequestException('student id invalid');

    if (!isValidSeminarGroupId(seminarGroupId))
      throw new BadRequestException('seminar group id invalid');

    return await this.timetableService.importTimetable(
      timetable,
      studentId,
      seminarGroupId,
    );
  }
}
