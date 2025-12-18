/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import {
  ExamChange,
  ExamDistribution,
  loadAllUsers,
  loadExamDistribution,
  saveExamDistribution,
  UserModule,
} from '../utils/file.utils';
import { Agent } from 'https';
import { create } from 'axios';
import {
  getMarkCount,
  getModuleCode,
  getPerId,
  getPerYr,
  getUserModuleString,
} from '../utils/utils';

const instance = create({
  httpsAgent: new Agent({
    rejectUnauthorized: false,
  }),
});

@Injectable()
export class CampusdualService {
  async getDistribution(exam: UserModule) {
    const [moduleCode, year, period] = exam;
    const searchParams = new URLSearchParams();
    searchParams.append('module', getModuleCode(moduleCode));
    searchParams.append('peryr', getPerYr(year));
    searchParams.append('perid', getPerId(period));
    const url =
      'https://selfservice.campus-dual.de/acwork/mscoredist?' +
      searchParams.toString();

    const response = await instance.get(url);
    return response.data as ExamDistribution;
  }

  async checkExam(exam: UserModule) {
    const oldDistribution = await loadExamDistribution(exam);
    const newDistribution = await this.getDistribution(exam);
    saveExamDistribution(exam, newDistribution);

    return {
      exam,
      oldDistribution,
      newDistribution,
      newResult:
        oldDistribution &&
        getMarkCount(newDistribution) !== getMarkCount(oldDistribution),
    } as ExamChange;
  }

  async checkExams() {
    const users = await loadAllUsers();
    const examsArray = Array.from(users.values()).flat();
    const exams = new Array<UserModule>();
    for (let exam of examsArray) {
      if (exams.map(getUserModuleString).includes(getUserModuleString(exam)))
        continue;
      exams.push(exam);
    }

    console.log(exams);

    const checkPromises = exams.map((exam) => this.checkExam(exam));
    const results = await Promise.all(checkPromises);
    const newResults = results.filter((result) => result.newResult);

    const resultMap = new Map<number, ExamChange[]>();
    for (let [chatId, exams] of users.entries()) {
      const ownNewExams = newResults.filter((result) =>
        exams
          .map(getUserModuleString)
          .includes(getUserModuleString(result.exam)),
      );

      resultMap.set(chatId, ownNewExams);
    }
    return resultMap;
  }
}
