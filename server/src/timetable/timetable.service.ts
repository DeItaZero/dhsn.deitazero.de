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
  async getTimetable(seminarGroupId: string, ignoredItems: string[] = []) {
    const timetables = await loadAllTimetables(seminarGroupId);
    let blocks = getDistinctObjects(timetables.flat(1));

    if (ignoredItems.length > 0) {
      const ignoredSet = new Set(ignoredItems);
      blocks = blocks.filter(block => {
        // Check for standalone module ignore
        if (ignoredSet.has(block.title)) {
          return false;
        }
        // Check for module|group pair ignore
        const group = getGroup(block);
        if (group) {
          const key = `${block.title}|${group}`;
          if (ignoredSet.has(key)) {
            return false;
          }
        }
        return true;
      });
    }

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
