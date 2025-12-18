import { Block } from '@shared/types/block.types';
import { ExamDistribution, UserModule } from './file.utils';

export const getDistinct = <T>(array: T[]): T[] => {
  // Guard clause: If array is null/undefined, return empty array
  if (!array) return [];

  return [...new Set(array)];
};

export const getDistinctObjects = <T>(array: T[]): T[] => {
  const seen = new Set<string>();

  return array.filter((item) => {
    const fingerprint = JSON.stringify(item);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
};

export const getGroup = (block: Block) =>
  /Gruppe (\w+)/.exec(block.remarks)?.at(1);

export const getUserModuleString = (userModule: UserModule) =>
  userModule.join('_');

export const getModuleCode = (moduleCode: string) =>
  moduleCode.replace(/-\d+$/, '-00');

export const getPerYr = (year: number) => year.toString();

export const getPerId = (period: 'WS' | 'SS') =>
  period === 'WS' ? '001' : '002';

export const getMarkCount = (distribution: ExamDistribution) =>
  Array.from(distribution.values()).reduce((a, b) => a + b.COUNT, 0);
