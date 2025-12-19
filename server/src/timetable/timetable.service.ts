/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Timetable } from '@shared/types/Timetable';
import { loadAllTimetables, saveTimetable } from '../utils/file.utils';
import ical, {
  ICalEventBusyStatus,
  ICalEventTransparency,
} from 'ical-generator';
import { getDistinctObjects, getGroup } from '../utils/utils';

@Injectable()
export class TimetableService {
  private readonly logger = new Logger(TimetableService.name);

  async getTimetable(
    seminarGroupId: string,
    ignoredItems: string[] = [],
    showedItems: string[] = [],
  ) {
    try {
      const timetables = await loadAllTimetables(seminarGroupId);
      let blocks = getDistinctObjects(timetables.flat(1));
      const isIgnoring = ignoredItems.length > 0;
      const isShowing = showedItems.length > 0;

      if (isIgnoring && isShowing)
        throw new BadRequestException("Can't combine ignore and show");

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

      if (isShowing) {
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
          transparency: isShowing // For Google, Apple, etc.
            ? ICalEventTransparency.TRANSPARENT
            : ICalEventTransparency.OPAQUE,
          busystatus: isShowing // For Microsoft
            ? ICalEventBusyStatus.FREE
            : ICalEventBusyStatus.BUSY,
        });
      }

      return calendar.toString();
    } catch (error) {
      this.logger.error(
        `Failed to load timetable for ${seminarGroupId}\n${error}`,
      );
      throw new InternalServerErrorException(`Failed to load timetable`);
    }
  }

  async importTimetable(
    timetable: Timetable,
    studentId: string,
    seminarGroupId: string,
  ) {
    try {
      await saveTimetable(timetable, studentId, seminarGroupId);
      this.logger.log(
        `Successfully saved timetable from ${studentId} for ${seminarGroupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save timetable from ${studentId} for ${seminarGroupId}\n${error}`,
      );
      throw new InternalServerErrorException('Failed to save timetable');
    }
  }
}
