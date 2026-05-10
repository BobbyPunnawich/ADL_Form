import type { Section, Question } from "@/db/schema";

export type AnswerMap = Record<string, { optionIndex: number; score: number }>;

export function calcSectionScore(
  questions: Question[],
  answers: AnswerMap
): number {
  return questions.reduce((sum, q) => {
    const answer = answers[q.id.toString()];
    return sum + (answer?.score ?? 0);
  }, 0);
}

export type BranchResult =
  | { action: "continue" }
  | { action: "terminate"; message: string; sectionId: number };

export function checkBranchingLogic(
  section: Section,
  score: number
): BranchResult {
  if (
    section.minimumScore !== null &&
    section.minimumScore !== undefined &&
    score < section.minimumScore
  ) {
    return {
      action: "terminate",
      message:
        section.terminationMessage ??
        "ขอบคุณสำหรับการตอบแบบสอบถาม คะแนนของท่านไม่ผ่านเกณฑ์ขั้นต่ำสำหรับส่วนนี้",
      sectionId: section.id,
    };
  }
  return { action: "continue" };
}

export function calcTotalScore(sectionScores: Record<string, number>): number {
  return Object.values(sectionScores).reduce((sum, s) => sum + s, 0);
}
