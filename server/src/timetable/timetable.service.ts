/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Timetable } from '@shared/types/timetable.types';
import { loadAllTimetables, saveTimetable } from '../utils/file.utils';
import ical, {
  ICalEventBusyStatus,
  ICalEventTransparency,
} from 'ical-generator';
import { getDistinctObjects, getGroup } from '../utils/utils';
import { Block } from '@shared/types/block.types';

@Injectable()
export class TimetableService {
  async getTimetable(seminarGroupId: string, ignoredItems: string[] = []) {
    const timetables = await loadAllTimetables(seminarGroupId);
    let blocks = getDistinctObjects(timetables.flat(1));
    const calendar = ical({
      name: `Stundenplan ${seminarGroupId}`,
      timezone: 'Europe/Berlin',
    });

    const ignoredSet = new Set(ignoredItems);
    const isIgnored = (block: Block) => {
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
    };

    for (let block of blocks) {
      const moduleCode = block.title;
      const moduleName = block.description;
      const group = getGroup(block);
      let description = `Modul: ${moduleCode}\nDozent: ${block.instructor}`;
      if (block.remarks) description += `\nBemerkungen: ${block.remarks}`;

      const ignored = isIgnored(block);

      calendar.createEvent({
        start: new Date(block.start * 1000),
        end: new Date(block.end * 1000),
        summary: group ? `${group} | ${moduleName}` : moduleName,
        allDay: block.allDay,
        location: block.room,
        description,
        transparency: ignored
          ? ICalEventTransparency.TRANSPARENT
          : ICalEventTransparency.OPAQUE,
        busystatus: ignored
          ? ICalEventBusyStatus.FREE
          : ICalEventBusyStatus.BUSY,
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
