/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Timetable } from '@shared/types/timetable.types';
import { TimetableService } from './timetable.service';
import { isValidSeminarGroupId, isValidStudentId } from '../utils/validators';

@Controller('/api/timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="timetable.ics"')
  async getTimetable(
    @Res() response: Response,
    @Query('seminarGroupId') seminarGroupId: string,
    @Query('ignore') ignore?: string,
    @Query('show') show?: string,
  ) {
    if (!isValidSeminarGroupId(seminarGroupId))
      throw new BadRequestException('seminar group id invalid');

    const ignoredModules = ignore ? ignore.split(',') : [];
    const showedModules = show ? show.split(',') : [];

    if (ignoredModules.length > 0 && showedModules.length > 0)
      throw new BadRequestException(
        'modules can be either explicitely ignored or showed',
      );

    const timetable = await this.timetableService.getTimetable(
      seminarGroupId,
      ignoredModules,
      showedModules,
    );

    response.send(timetable);
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
