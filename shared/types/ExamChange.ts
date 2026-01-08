import type { Exam } from './Exam';
import type { ExamDistribution } from './ExamDistribution';


export type ExamChange = {
  exam: Exam;
  oldDistribution: ExamDistribution | null;
  newDistribution: ExamDistribution;
  newResult: boolean;
};
