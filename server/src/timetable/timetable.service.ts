/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Timetable } from '@shared/types/timetable.types';
import { loadAllTimetables, saveTimetable } from '../utils/file.utils';
import ical from 'ical-generator';
import { getDistinctObjects, getGroup } from '../utils/utils';

@Injectable()
export class TimetableService {
  async getTimetable(seminarGroupId: string) {
    const timetables = await loadAllTimetables(seminarGroupId);
    const blocks = getDistinctObjects(timetables.flat(1));
    const calendar = ical({ name: `Stundenplan ${seminarGroupId}` });

    for (let block of blocks) {
      const group = getGroup(block);

      calendar.createEvent({
        start: new Date(block.start * 1000),
        summary: block.title,
        description: `${block.instructor}`,
      });
    }

    return calendar.toString();
  }

  async importTimetable(
    timetable: Timetable,
    studentId: string,
    seminarGroupId: string,
  ) {
    return await saveTimetable(timetable, studentId, seminarGroupId);
  }
}
