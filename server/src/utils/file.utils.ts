import { InternalServerErrorException } from '@nestjs/common';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import { Timetable } from '@shared/types/timetable.types';

export async function getAllTimetables(seminarGroupId: string) {
  try {
    const dirPath = path.join(process.cwd(), 'data', seminarGroupId);

    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const filePaths = files
      .filter((file) => file.isFile()) // Ignore directories
      .map((file) => file.name)
      .map((filename) => path.join(dirPath, filename));

    const readPromises = filePaths.map(async (filePath) => {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Timetable;
    });

    return await Promise.all(readPromises);
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to save file');
  }
}
