export type QuestionType =
  | "multiple_choice" // large clickable cards
  | "radio"           // traditional radio buttons
  | "checkbox"        // multiple-select checkboxes
  | "dropdown"        // select element
  | "short_answer"    // single-line text
  | "long_answer"     // multi-line textarea
  | "linear_scale"    // numeric rating scale
  | "likert"          // 5-point MBTI-style circle scale (-2 to +2)
  | "radio_grid"      // matrix: rows × columns, one selection per row
  | "checkbox_grid";  // matrix: rows × columns, multiple selections per row

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "ตัวเลือกบัตรใหญ่",
  radio: "ตัวเลือก (Radio)",
  checkbox: "หลายตัวเลือก (Checkbox)",
  dropdown: "รายการเลื่อน (Dropdown)",
  short_answer: "คำตอบสั้น",
  long_answer: "คำตอบยาว",
  linear_scale: "มาตราส่วน (Scale)",
  likert: "ลิเคิร์ต 5 ระดับ",
  radio_grid: "ตารางตัวเลือก (Radio Grid)",
  checkbox_grid: "ตารางช่องทำเครื่องหมาย (Checkbox Grid)",
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  multiple_choice: "🟦",
  radio: "🔘",
  checkbox: "☑️",
  dropdown: "🔽",
  short_answer: "✏️",
  long_answer: "📝",
  linear_scale: "📊",
  likert: "⬤",
  radio_grid: "⊞",
  checkbox_grid: "⊟",
};

// ─── Option structures (stored as JSONB) ──────────────────────────────────────

export type ChoiceOption = { label: string; label_en?: string; score: number };

// options for choice-based types (multiple_choice, radio, checkbox, dropdown)
export type ChoiceOptions = ChoiceOption[];

// options for text types (short_answer, long_answer)
export type TextOptions = { placeholder?: string; placeholder_en?: string };

// options for linear_scale
export type ScaleOptions = {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  minLabel_en?: string;
  maxLabel_en?: string;
};

// options for likert (fixed 5-point scale; labels are customisable per question)
export type LikertOptions = {
  labels_th?: [string, string, string, string, string];
  labels_en?: [string, string, string, string, string];
};

// options for grid types (radio_grid, checkbox_grid)
export type GridOptions = {
  rows: string[];
  rows_en?: string[];
  columns: ChoiceOption[];
};

export type QuestionOptions = ChoiceOptions | TextOptions | ScaleOptions | LikertOptions | GridOptions;

// Default options per type
export function defaultOptions(type: QuestionType): QuestionOptions {
  switch (type) {
    case "multiple_choice":
    case "radio":
    case "checkbox":
    case "dropdown":
      return [
        { label: "ตัวเลือกที่ 1", score: 0 },
        { label: "ตัวเลือกที่ 2", score: 1 },
      ] as ChoiceOptions;
    case "short_answer":
    case "long_answer":
      return { placeholder: "" } as TextOptions;
    case "linear_scale":
      return { min: 1, max: 5, minLabel: "น้อยที่สุด", maxLabel: "มากที่สุด" } as ScaleOptions;
    case "likert":
      return {} as LikertOptions;
    case "radio_grid":
    case "checkbox_grid":
      return {
        rows: ["แถวที่ 1", "แถวที่ 2"],
        columns: [
          { label: "ตัวเลือก ก", score: 0 },
          { label: "ตัวเลือก ข", score: 1 },
          { label: "ตัวเลือก ค", score: 2 },
        ],
      } as GridOptions;
  }
}

// ─── Answer value (stored in response.answers JSONB) ─────────────────────────

export type AnswerValue = {
  score: number;
  optionIndex?: number;               // single choice types
  selectedIndices?: number[];         // checkbox
  text?: string;                      // text types
  scaleValue?: number;                // linear_scale, likert (-2 to +2)
  rowSelections?: Record<string, number>;    // radio_grid: rowIdx -> colIdx
  rowMultiSelections?: Record<string, number[]>; // checkbox_grid: rowIdx -> colIdxs[]
};

// ─── DB row types ─────────────────────────────────────────────────────────────

export type Form = {
  id: number;
  title: string;
  description: string | null;
  closing_message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: number;
  form_id: number;
  title: string;
  description: string | null;
  order: number;
  minimum_score: number | null;
  termination_message: string | null;
  created_at: string;
};

export type Question = {
  id: number;
  section_id: number;
  text: string;
  text_en?: string;
  type: QuestionType;
  order: number;
  required: boolean;
  options: QuestionOptions;
  created_at: string;
};

export type SectionWithQuestions = Section & { questions: Question[] };
export type FormWithSections = Form & { sections: SectionWithQuestions[] };

export type Response = {
  id: number;
  form_id: number;
  session_id: string;
  answers: Record<string, AnswerValue>;
  section_scores: Record<string, number>;
  total_score: number;
  status: string;
  terminated_at_section: number | null;
  submitted_at: string;
};
