import { Exam } from './Exam';
import { ExamDistribution } from './ExamDistribution';


export type ExamChange = {
  exam: Exam;
  oldDistribution: ExamDistribution | null;
  newDistribution: ExamDistribution;
  newResult: boolean;
};
