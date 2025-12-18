/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Timetable } from '@shared/types/Timetable';
import { loadAllTimetables, saveTimetable } from '../utils/file.utils';
import ical, {
  ICalEventBusyStatus,
  ICalEventTransparency,
} from 'ical-generator';
import { getDistinctObjects, getGroup } from '../utils/utils';

@Injectable()
export class TimetableService {
  async getTimetable(
    seminarGroupId: string,
    ignoredItems: string[] = [],
    showedItems: string[] = [],
  ) {
    const timetables = await loadAllTimetables(seminarGroupId);
    let blocks = getDistinctObjects(timetables.flat(1));
    const isIgnoring = ignoredItems.length > 0;

    if (isIgnoring) {
      const ignoredSet = new Set(ignoredItems);
      blocks = blocks.filter((block) => {
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

    if (!isIgnoring) {
      const showedSet = new Set(showedItems);
      blocks = blocks.filter((block) => {
        // Check for standalone module ignore
        if (showedSet.has(block.title)) {
          return true;
        }
        // Check for module|group pair ignore
        const group = getGroup(block);
        if (group) {
          const key = `${block.title}|${group}`;
          if (showedSet.has(key)) {
            return true;
          }
        }
        return false;
      });
    }

    const calendar = ical({
      name: `Stundenplan ${seminarGroupId}`,
      timezone: 'Europe/Berlin',
    });

    for (let block of blocks) {
      const moduleCode = block.title;
      const moduleName = block.description;
      const group = getGroup(block);
      let description = `Modul: ${moduleCode}\nDozent: ${block.instructor}`;
      if (block.remarks) description += `\nBemerkungen: ${block.remarks}`;

      calendar.createEvent({
        start: new Date(block.start * 1000),
        end: new Date(block.end * 1000),
        summary: group ? `${group} | ${moduleName}` : moduleName,
        allDay: block.allDay,
        location: block.room,
        description,
        transparency: isIgnoring // For Google, Apple, etc.
          ? ICalEventTransparency.OPAQUE
          : ICalEventTransparency.TRANSPARENT,
        busystatus: isIgnoring // For Microsoft
          ? ICalEventBusyStatus.BUSY
          : ICalEventBusyStatus.FREE,
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
