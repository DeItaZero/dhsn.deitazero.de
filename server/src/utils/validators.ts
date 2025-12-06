export function isValidStudentId(studentId: string) {
  return /^s\d+$/.test(studentId);
}

export function isValidSeminarGroupId(seminarGroupId: string) {
  return /^[A-Z]+\d+-[12]$/.test(seminarGroupId);
}
