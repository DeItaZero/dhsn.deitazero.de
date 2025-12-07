export function isValidStudentId(studentId: string) {
  return /^s\d+$/.test(studentId);
}

export function isValidSeminarGroupId(seminarGroupId: string) {
  return /^[A-Z]+\d+-[12]$/.test(seminarGroupId);
}

export function isValidModuleCode(moduleCode: string) {
  return /^\d[A-Z]+-\w+-\d+$/.test(moduleCode);
}

export function isValidGroup(group: string) {
  return /^\w+$/.test(group);
}
