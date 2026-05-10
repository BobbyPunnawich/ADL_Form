import type { Question, AnswerValue, ChoiceOptions, GridOptions } from "@/types/db";

export function calcQuestionScore(question: Question, answer: AnswerValue | undefined): number {
  if (!answer) return 0;
  const opts = question.options;

  switch (question.type) {
    case "multiple_choice":
    case "radio":
    case "dropdown": {
      if (answer.optionIndex === undefined) return 0;
      const choices = opts as ChoiceOptions;
      return choices[answer.optionIndex]?.score ?? 0;
    }
    case "checkbox": {
      const choices = opts as ChoiceOptions;
      return (answer.selectedIndices ?? []).reduce(
        (sum, i) => sum + (choices[i]?.score ?? 0),
        0
      );
    }
    case "short_answer":
    case "long_answer":
      return 0;
    case "linear_scale":
      return answer.scaleValue ?? 0;
    case "radio_grid": {
      const grid = opts as GridOptions;
      return Object.values(answer.rowSelections ?? {}).reduce(
        (sum, colIdx) => sum + (grid.columns[colIdx]?.score ?? 0),
        0
      );
    }
    case "checkbox_grid": {
      const grid = opts as GridOptions;
      return Object.values(answer.rowMultiSelections ?? {}).reduce(
        (sum, cols) =>
          sum + cols.reduce((s, ci) => s + (grid.columns[ci]?.score ?? 0), 0),
        0
      );
    }
    default:
      return 0;
  }
}

export function calcSectionScore(
  questions: Question[],
  answers: Record<string, AnswerValue>
): number {
  return questions.reduce(
    (sum, q) => sum + calcQuestionScore(q, answers[q.id.toString()]),
    0
  );
}

export function isQuestionAnswered(
  question: Question,
  answer: AnswerValue | undefined
): boolean {
  if (!answer) return false;
  switch (question.type) {
    case "multiple_choice":
    case "radio":
    case "dropdown":
      return answer.optionIndex !== undefined;
    case "checkbox":
      return (answer.selectedIndices?.length ?? 0) > 0;
    case "short_answer":
    case "long_answer":
      return (answer.text?.trim().length ?? 0) > 0;
    case "linear_scale":
      return answer.scaleValue !== undefined;
    case "radio_grid": {
      const grid = question.options as GridOptions;
      return grid.rows.every((_, i) => answer.rowSelections?.[i.toString()] !== undefined);
    }
    case "checkbox_grid":
      return true; // checkbox_grid rows are optional
    default:
      return true;
  }
}

export function calcTotalScore(sectionScores: Record<string, number>): number {
  return Object.values(sectionScores).reduce((s, v) => s + v, 0);
}
