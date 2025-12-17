import { InternalServerErrorException } from '@nestjs/common';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import { Timetable } from '@shared/types/timetable.types';
import { isValidSeminarGroupId } from './validators';
import { Module } from '@shared/types/modules.types';

export async function loadSeminarGroupIds() {
  try {
    const dirPath = path.join(process.cwd(), 'data');

    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const seminarGroupIds = items
      .filter((item) => item.isDirectory()) // Only directories
      .map((dir) => dir.name)
      .filter((name) => isValidSeminarGroupId(name));

    return seminarGroupIds;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to load file');
  }
}

export async function loadAllTimetables(seminarGroupId: string) {
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
    throw new InternalServerErrorException('Failed to load file');
  }
}

export async function saveTimetable(
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

export type UserModule = [string, number, string];

export async function loadUser(chatId: number) {
  const filePath = path.join(
    process.cwd(),
    'data',
    'MarkAlerts',
    `${chatId}.json`,
  );

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as UserModule[];
  } catch (error) {
    return [] as UserModule[];
  }
}

export async function saveUser(chatId: number, modules: UserModule[]) {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'MarkAlerts');
    const filePath = path.join(dirPath, `${chatId}.json`);
    const fileContent = JSON.stringify(modules, null, 2);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, fileContent, 'utf-8');
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to save file');
  }
}
