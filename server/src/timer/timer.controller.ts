import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { isValidSeminarGroupId } from '../utils/validators';
import { TimetableService } from '../timetable/timetable.service';

@Controller('/api/timer')
export class TimerController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  async getTimetableBlocks(
    @Res() response: Response,
    @Query('seminarGroupId') seminarGroupId: string,
    @Query('ignore') ignore?: string,
    @Query('show') show?: string,
  ) {
    if (!isValidSeminarGroupId(seminarGroupId))
      throw new BadRequestException('Seminar group id invalid');

    const ignoredModules = ignore ? ignore.split(',') : [];
    const showedModules = show ? show.split(',') : [];

    if (ignoredModules.length > 0 && showedModules.length > 0)
      throw new BadRequestException(
        'Modules can be either explicitely ignored or showed',
      );

    let { blocks } = await this.timetableService.getTimetableBlocks(
      seminarGroupId,
      ignoredModules,
      showedModules,
    );

    const todayMorning = new Date();
    todayMorning.setHours(0, 0, 0, 0);

    const todayEvening = new Date();
    todayEvening.setHours(23, 59, 59, 999);

    blocks = blocks.filter((block) => {
      const blockTime = new Date(block.start * 1_000).getTime();
      return (
        todayMorning.getTime() < blockTime && blockTime < todayEvening.getTime()
      );
    });

    response.send(blocks);
  }
}
