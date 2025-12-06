import { Block } from '@shared/types/block.types';

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
