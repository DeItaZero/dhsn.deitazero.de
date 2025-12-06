/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Timetable } from '@shared/types/timetable.types';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getAllTimetables } from '../utils/file.utils';

@Injectable()
export class TimetableService {
  async getTimetable(seminarGroupId: string) {
    const timetables = await getAllTimetables(seminarGroupId);
    return timetables;
  }

  async importTimetable(
    timetable: Timetable,
    studentId: string,
    seminarGroupId: string,
  ) {
    try {
      const dirPath = path.join(process.cwd(), 'data', seminarGroupId);
      const filePath = path.join(dirPath, `${studentId}.json`);
      const fileContent = JSON.stringify(timetable, null, 2);

      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(filePath, fileContent, 'utf-8');
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to save file');
    }
  }
}
