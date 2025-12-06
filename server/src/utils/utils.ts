export const getDistinct = <T>(array: T[]): T[] => {
  // Guard clause: If array is null/undefined, return empty array
  if (!array) return [];

  return [...new Set(array)];
};
