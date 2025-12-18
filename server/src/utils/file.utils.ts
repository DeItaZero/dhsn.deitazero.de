import { InternalServerErrorException } from '@nestjs/common';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import { Timetable } from '@shared/types/Timetable';
import { getExamString } from './utils';
import { ExamDistribution } from '@shared/types/ExamDistribution';
import { Exam } from '@shared/types/Exam';

export async function loadSeminarGroupIds() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'timetables');

    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const seminarGroupIds = items
      .filter((item) => item.isDirectory()) // Only directories
      .map((dir) => dir.name);

    return seminarGroupIds;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to load file');
  }
}

export async function loadAllTimetables(seminarGroupId: string) {
  try {
    const dirPath = path.join(
      process.cwd(),
      'data',
      'timetables',
      seminarGroupId,
    );

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
    const dirPath = path.join(
      process.cwd(),
      'data',
      'timetables',
      seminarGroupId,
    );
    const filePath = path.join(dirPath, `${studentId}.json`);
    const fileContent = JSON.stringify(timetable, null, 2);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, fileContent, 'utf-8');
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to save file');
  }
}

export async function loadAllUsers() {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'mark_alerts', 'users');
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const filePaths = files
      .filter((file) => file.isFile()) // Ignore directories
      .map((file) => file.name)
      .map((filename) => path.join(dirPath, filename));

    const readPromises = filePaths.map(async (filePath) => {
      const chatId = +path.basename(filePath, '.json');
      const content = await fs.readFile(filePath, 'utf-8');
      return [chatId, JSON.parse(content) as Exam[]] as [number, Exam[]];
    });
    const users = await Promise.all(readPromises);
    return new Map(users);
  } catch (error) {
    return new Map<number, Exam[]>();
  }
}

export async function loadUser(chatId: number) {
  const filePath = path.join(
    process.cwd(),
    'data',
    'mark_alerts',
    'users',
    `${chatId}.json`,
  );

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as Exam[];
  } catch (error) {
    return [] as Exam[];
  }
}

export async function saveUser(chatId: number, modules: Exam[]) {
  try {
    const dirPath = path.join(process.cwd(), 'data', 'mark_alerts', 'users');
    const filePath = path.join(dirPath, `${chatId}.json`);
    const fileContent = JSON.stringify(modules, null, 2);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, fileContent, 'utf-8');
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to save file');
  }
}

export async function loadExamsDistributions() {
  try {
    const dirPath = path.join(
      process.cwd(),
      'data',
      'mark_alerts',
      'exam_distributions',
    );
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

export async function loadExamDistribution(exam: Exam) {
  const filePath = path.join(
    process.cwd(),
    'data',
    'mark_alerts',
    'exam_distributions',
    `${getExamString(exam)}.json`,
  );

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as ExamDistribution;
  } catch (error) {
    return null;
  }
}

export async function saveExamDistribution(
  exam: Exam,
  distribution: ExamDistribution,
) {
  try {
    const dirPath = path.join(
      process.cwd(),
      'data',
      'mark_alerts',
      'exam_distributions',
    );
    const filePath = path.join(dirPath, `${getExamString(exam)}.json`);
    const fileContent = JSON.stringify(distribution, null, 2);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, fileContent, 'utf-8');
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Failed to save file');
  }
}
