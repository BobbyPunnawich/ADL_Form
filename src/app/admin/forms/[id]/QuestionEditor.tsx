"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Question, QuestionType, QuestionOptions,
  ChoiceOptions, TextOptions, ScaleOptions, GridOptions, LikertOptions,
} from "@/types/db";
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_ICONS, defaultOptions } from "@/types/db";

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const CHOICE_TYPES: QuestionType[] = ["multiple_choice", "radio", "checkbox", "dropdown"];
const isChoiceType = (t: QuestionType) => CHOICE_TYPES.includes(t);
const isGridType = (t: QuestionType) => t === "radio_grid" || t === "checkbox_grid";
const isTextType = (t: QuestionType) => t === "short_answer" || t === "long_answer";
const isScaleType = (t: QuestionType) => t === "linear_scale";
const isLikertType = (t: QuestionType) => t === "likert";

// ─── Type selector ────────────────────────────────────────────────────────────

function TypeSelector({ value, onChange }: { value: QuestionType; onChange: (t: QuestionType) => void }) {
  const groups: { label: string; types: QuestionType[] }[] = [
    { label: "ตัวเลือก / Choice", types: ["multiple_choice", "radio", "checkbox", "dropdown"] },
    { label: "ข้อความ / Text", types: ["short_answer", "long_answer"] },
    { label: "พิเศษ / Special", types: ["linear_scale", "likert", "radio_grid", "checkbox_grid"] },
  ];
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-xs text-gray-400 font-medium mb-1">{g.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {g.types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  value === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <span>{QUESTION_TYPE_ICONS[t]}</span>
                {QUESTION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Choice options editor ────────────────────────────────────────────────────

function ChoiceOptionsEditor({ options, onChange }: { options: ChoiceOptions; onChange: (o: ChoiceOptions) => void }) {
  const LETTERS = ["ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ"];
  const update = (idx: number, field: string, value: string | number) =>
    onChange(options.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[28px_1fr_1fr_52px_32px] gap-1.5 text-xs font-medium text-gray-400 px-1 mb-0.5">
        <span />
        <span>ข้อความ (TH)</span>
        <span>Text (EN)</span>
        <span className="text-center">คะแนน</span>
        <span />
      </div>
      {options.map((opt, i) => (
        <div key={i} className="grid grid-cols-[28px_1fr_1fr_52px_32px] items-center gap-1.5">
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
            {LETTERS[i] ?? i + 1}
          </span>
          <input
            type="text"
            value={opt.label}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder="ข้อความตัวเลือก..."
            className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:border-blue-400 focus:outline-none w-full"
          />
          <input
            type="text"
            value={opt.label_en ?? ""}
            onChange={(e) => update(i, "label_en", e.target.value)}
            placeholder="Option text..."
            className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:border-blue-400 focus:outline-none w-full"
          />
          <input
            type="number"
            min="0"
            value={opt.score}
            onChange={(e) => update(i, "score", parseInt(e.target.value) || 0)}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:border-blue-400 focus:outline-none w-full"
          />
          <button
            type="button"
            onClick={() => onChange(options.filter((_, j) => j !== i))}
            disabled={options.length <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 text-lg"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...options, { label: "", label_en: "", score: 0 }])}
        className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 pt-1"
      >
        + เพิ่มตัวเลือก / Add option
      </button>
    </div>
  );
}

// ─── Text options editor ──────────────────────────────────────────────────────

function TextOptionsEditor({ options, onChange }: { options: TextOptions; onChange: (o: TextOptions) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder (TH)</label>
          <input
            type="text"
            value={options.placeholder ?? ""}
            onChange={(e) => onChange({ ...options, placeholder: e.target.value })}
            placeholder="เช่น พิมพ์คำตอบที่นี่..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder (EN)</label>
          <input
            type="text"
            value={options.placeholder_en ?? ""}
            onChange={(e) => onChange({ ...options, placeholder_en: e.target.value })}
            placeholder="e.g. Type your answer here..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">คำถามประเภทนี้ไม่มีคะแนน / No score for this type</p>
    </div>
  );
}

// ─── Scale options editor ─────────────────────────────────────────────────────

function ScaleOptionsEditor({ options, onChange }: { options: ScaleOptions; onChange: (o: ScaleOptions) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ค่าต่ำสุด / Min value</label>
          <input
            type="number"
            value={options.min}
            onChange={(e) => onChange({ ...options, min: parseInt(e.target.value) || 1 })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ค่าสูงสุด / Max value</label>
          <input
            type="number"
            value={options.max}
            onChange={(e) => onChange({ ...options, max: parseInt(e.target.value) || 5 })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ป้ายต่ำสุด (TH)</label>
          <input
            type="text"
            value={options.minLabel ?? ""}
            onChange={(e) => onChange({ ...options, minLabel: e.target.value })}
            placeholder="น้อยที่สุด"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min label (EN)</label>
          <input
            type="text"
            value={options.minLabel_en ?? ""}
            onChange={(e) => onChange({ ...options, minLabel_en: e.target.value })}
            placeholder="Least"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ป้ายสูงสุด (TH)</label>
          <input
            type="text"
            value={options.maxLabel ?? ""}
            onChange={(e) => onChange({ ...options, maxLabel: e.target.value })}
            placeholder="มากที่สุด"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Max label (EN)</label>
          <input
            type="text"
            value={options.maxLabel_en ?? ""}
            onChange={(e) => onChange({ ...options, maxLabel_en: e.target.value })}
            placeholder="Most"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">คะแนน = ค่าที่เลือก / Score equals selected value</p>
    </div>
  );
}

// ─── Likert options (editable labels) ────────────────────────────────────────

const LIKERT_META = [
  { score: 2,  defaultTh: "เห็นด้วยอย่างยิ่ง",   defaultEn: "Strongly Agree",    circleColor: "bg-emerald-500", circleSize: "w-7 h-7" },
  { score: 1,  defaultTh: "เห็นด้วย",             defaultEn: "Agree",             circleColor: "bg-emerald-300", circleSize: "w-5 h-5" },
  { score: 0,  defaultTh: "เฉยๆ",                 defaultEn: "Neutral",           circleColor: "bg-gray-300",    circleSize: "w-3.5 h-3.5" },
  { score: -1, defaultTh: "ไม่เห็นด้วย",          defaultEn: "Disagree",          circleColor: "bg-purple-300",  circleSize: "w-5 h-5" },
  { score: -2, defaultTh: "ไม่เห็นด้วยอย่างยิ่ง", defaultEn: "Strongly Disagree", circleColor: "bg-purple-500",  circleSize: "w-7 h-7" },
] as const;

function LikertOptionsEditor({ options, onChange }: { options: LikertOptions; onChange: (o: LikertOptions) => void }) {
  const thLabels: [string, string, string, string, string] = [
    options.labels_th?.[0] ?? LIKERT_META[0].defaultTh,
    options.labels_th?.[1] ?? LIKERT_META[1].defaultTh,
    options.labels_th?.[2] ?? LIKERT_META[2].defaultTh,
    options.labels_th?.[3] ?? LIKERT_META[3].defaultTh,
    options.labels_th?.[4] ?? LIKERT_META[4].defaultTh,
  ];
  const enLabels: [string, string, string, string, string] = [
    options.labels_en?.[0] ?? LIKERT_META[0].defaultEn,
    options.labels_en?.[1] ?? LIKERT_META[1].defaultEn,
    options.labels_en?.[2] ?? LIKERT_META[2].defaultEn,
    options.labels_en?.[3] ?? LIKERT_META[3].defaultEn,
    options.labels_en?.[4] ?? LIKERT_META[4].defaultEn,
  ];

  const updateTh = (i: number, val: string) => {
    const next = [...thLabels] as [string, string, string, string, string];
    next[i] = val;
    onChange({ ...options, labels_th: next });
  };
  const updateEn = (i: number, val: string) => {
    const next = [...enLabels] as [string, string, string, string, string];
    next[i] = val;
    onChange({ ...options, labels_en: next });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[28px_1fr_1fr_44px] gap-x-2 gap-y-0.5 text-xs font-medium text-gray-400 px-1">
        <span />
        <span>ข้อความ (TH)</span>
        <span>Label (EN)</span>
        <span className="text-center">คะแนน</span>
      </div>
      {LIKERT_META.map((m, i) => (
        <div key={m.score} className="grid grid-cols-[28px_1fr_1fr_44px] items-center gap-2">
          <div className="flex items-center justify-center">
            <div className={`rounded-full flex-shrink-0 ${m.circleColor} ${m.circleSize}`} />
          </div>
          <input
            type="text"
            value={thLabels[i]}
            onChange={(e) => updateTh(i, e.target.value)}
            placeholder={m.defaultTh}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none w-full"
          />
          <input
            type="text"
            value={enLabels[i]}
            onChange={(e) => updateEn(i, e.target.value)}
            placeholder={m.defaultEn}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none w-full"
          />
          <p className="text-sm font-bold text-center text-gray-600">
            {m.score > 0 ? `+${m.score}` : m.score}
          </p>
        </div>
      ))}
      <p className="text-xs text-gray-400">คะแนน = ค่าที่เลือก (+2 ถึง −2) ปรับได้เฉพาะข้อความ / Score is fixed; only labels are editable</p>
    </div>
  );
}

// ─── Grid options editor ──────────────────────────────────────────────────────

function GridOptionsEditor({ options, onChange }: { options: GridOptions; onChange: (o: GridOptions) => void }) {
  const updateRow = (i: number, val: string) =>
    onChange({ ...options, rows: options.rows.map((r, j) => (j === i ? val : r)) });

  const updateRowEn = (i: number, val: string) => {
    const rows_en = [...(options.rows_en ?? options.rows.map(() => ""))];
    rows_en[i] = val;
    onChange({ ...options, rows_en });
  };

  const updateCol = (i: number, field: string, val: string | number) =>
    onChange({ ...options, columns: options.columns.map((c, j) => (j === i ? { ...c, [field]: val } : c)) });

  return (
    <div className="space-y-4">
      {/* Rows */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">แถว / Rows</p>
        <div className="grid grid-cols-[1fr_1fr_32px] gap-1.5 text-xs font-medium text-gray-400 px-1 mb-1">
          <span>ข้อความแถว (TH)</span>
          <span>Row text (EN)</span>
          <span />
        </div>
        <div className="space-y-1.5">
          {options.rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-1.5 items-center">
              <input
                type="text"
                value={row}
                onChange={(e) => updateRow(i, e.target.value)}
                placeholder={`แถวที่ ${i + 1}`}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                type="text"
                value={options.rows_en?.[i] ?? ""}
                onChange={(e) => updateRowEn(i, e.target.value)}
                placeholder={`Row ${i + 1}`}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const rows_en = options.rows_en?.filter((_, j) => j !== i);
                  onChange({ ...options, rows: options.rows.filter((_, j) => j !== i), rows_en });
                }}
                disabled={options.rows.length <= 1}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-30 text-lg"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const rows_en = [...(options.rows_en ?? options.rows.map(() => "")), ""];
              onChange({ ...options, rows: [...options.rows, ""], rows_en });
            }}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 pt-1"
          >
            + เพิ่มแถว / Add row
          </button>
        </div>
      </div>

      {/* Columns */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">คอลัมน์ / Columns</p>
        <div className="grid grid-cols-[1fr_1fr_52px_32px] gap-1.5 text-xs font-medium text-gray-400 px-1 mb-1">
          <span>ข้อความ (TH)</span>
          <span>Text (EN)</span>
          <span className="text-center">คะแนน</span>
          <span />
        </div>
        <div className="space-y-1.5">
          {options.columns.map((col, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_52px_32px] gap-1.5 items-center">
              <input
                type="text"
                value={col.label}
                onChange={(e) => updateCol(i, "label", e.target.value)}
                placeholder={`ตัวเลือก ${i + 1}`}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                type="text"
                value={col.label_en ?? ""}
                onChange={(e) => updateCol(i, "label_en", e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                type="number"
                min="0"
                value={col.score}
                onChange={(e) => updateCol(i, "score", parseInt(e.target.value) || 0)}
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:border-blue-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onChange({ ...options, columns: options.columns.filter((_, j) => j !== i) })}
                disabled={options.columns.length <= 1}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-30 text-lg"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...options, columns: [...options.columns, { label: "", label_en: "", score: 0 }] })}
            className="text-sm text-blue-600 font-medium hover:text-blue-700 pt-1"
          >
            + เพิ่มคอลัมน์ / Add column
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── QuestionEditor (main export) ────────────────────────────────────────────

export default function QuestionEditor({
  question,
  number,
  onSaved,
  onDeleted,
  onDuplicated,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  saveAllTrigger = 0,
}: {
  question: Question;
  number: number;
  onSaved: (q: Question) => void;
  onDeleted: (id: number) => void;
  onDuplicated?: (newQ: Question) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  saveAllTrigger?: number;
}) {
  const [text, setText] = useState(question.text);
  const [textEn, setTextEn] = useState(question.text_en ?? "");
  const [type, setType] = useState<QuestionType>(question.type);
  const [options, setOptions] = useState<QuestionOptions>(question.options);
  const [required, setRequired] = useState(question.required ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const isDirty =
    text !== question.text ||
    textEn !== (question.text_en ?? "") ||
    type !== question.type ||
    required !== (question.required ?? true) ||
    JSON.stringify(options) !== JSON.stringify(question.options);

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    setOptions(defaultOptions(newType));
    setShowTypeSelector(false);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await api("PUT", `/api/questions/${question.id}`, {
        text,
        text_en: textEn || null,
        type,
        options,
        required,
      });
      // Sync local state to the DB response so isDirty becomes false immediately
      setText(updated.text);
      setTextEn(updated.text_en ?? "");
      setType(updated.type);
      setOptions(updated.options);
      setRequired(updated.required ?? true);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ / Save failed");
    } finally {
      setSaving(false);
    }
  }, [text, textEn, type, options, required, question.id, onSaved]);

  // Fire save when "Save All" is triggered from parent, but only if dirty
  useEffect(() => {
    if (saveAllTrigger > 0 && isDirty) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveAllTrigger]);

  const handleDelete = async () => {
    if (!confirm(`ลบคำถามข้อ ${number}?`)) return;
    setDeleting(true);
    try {
      await api("DELETE", `/api/questions/${question.id}`);
      onDeleted(question.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!onDuplicated) return;
    setDuplicating(true);
    try {
      const newQ = await api("POST", "/api/questions", {
        section_id: question.section_id,
        text: text,
        text_en: textEn || null,
        type,
        options,
        required,
      });
      onDuplicated(newQ);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-colors ${
      saved ? "border-green-400 shadow-green-100 shadow-md" :
      isDirty ? "border-amber-400 shadow-amber-100 shadow-md" : "border-gray-200"
    }`}>
      {/* Header */}
      <div className={`border-b px-4 py-2.5 flex items-center gap-2 ${
        saved ? "bg-green-50 border-green-200" :
        isDirty ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
      }`}>
        <span className="text-sm font-semibold text-gray-600 flex-shrink-0">ข้อ {number}</span>
        <button
          type="button"
          onClick={() => setShowTypeSelector((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium border transition-colors ${
            showTypeSelector
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
          }`}
        >
          <span>{QUESTION_TYPE_ICONS[type]}</span>
          {QUESTION_TYPE_LABELS[type]}
          <span className="ml-0.5 opacity-60 text-xs">▾</span>
        </button>
        {saved ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            ✓ บันทึกแล้ว
          </span>
        ) : isDirty ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
            ยังไม่ได้บันทึก
          </span>
        ) : null}
        <div className="flex-1" />
        {/* Move up/down */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="ขึ้น / Move up"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="ลง / Move down"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {/* Required toggle */}
        <button
          type="button"
          onClick={() => setRequired((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
            required
              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            required ? "border-red-500 bg-red-500" : "border-gray-400 bg-white"
          }`}>
            {required && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />}
          </span>
          {required ? "บังคับตอบ / Required" : "ไม่บังคับ / Optional"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50"
        >
          {deleting ? "ลบ..." : "ลบคำถาม"}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Type selector panel */}
        {showTypeSelector && (
          <div className="border border-blue-100 rounded-xl p-4 bg-blue-50">
            <p className="text-xs font-semibold text-blue-700 mb-3">เลือกรูปแบบคำถาม / Question type</p>
            <TypeSelector value={type} onChange={handleTypeChange} />
          </div>
        )}

        {/* Question text — TH + EN */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              ข้อความคำถาม (TH)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="พิมพ์คำถามที่นี่..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Question Text (EN)
            </label>
            <textarea
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              rows={2}
              placeholder="Type question here..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Options editor */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {isChoiceType(type) && "ตัวเลือกและคะแนน / Choices & Scores"}
            {isTextType(type) && "ตั้งค่าคำถามข้อความ / Text settings"}
            {isScaleType(type) && "ตั้งค่ามาตราส่วน / Scale settings"}
            {isLikertType(type) && "มาตราส่วนลิเคิร์ต / Likert scale"}
            {isGridType(type) && "ตั้งค่าตาราง / Grid settings"}
          </label>

          {isChoiceType(type) && (
            <ChoiceOptionsEditor options={options as ChoiceOptions} onChange={setOptions} />
          )}
          {isTextType(type) && (
            <TextOptionsEditor options={options as TextOptions} onChange={setOptions} />
          )}
          {isScaleType(type) && (
            <ScaleOptionsEditor options={options as ScaleOptions} onChange={setOptions} />
          )}
          {isLikertType(type) && (
            <LikertOptionsEditor options={options as LikertOptions} onChange={setOptions} />
          )}
          {isGridType(type) && (
            <GridOptionsEditor options={options as GridOptions} onChange={setOptions} />
          )}
        </div>

        {/* Save */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex-1">
            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                ⚠ {saveError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-green-600 font-medium">✓ บันทึกแล้ว / Saved</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                saved
                  ? "bg-green-100 text-green-700"
                  : isDirty
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              } disabled:opacity-60`}
            >
              {saving ? "กำลังบันทึก..." : saved ? "✓ บันทึกแล้ว" : "บันทึกคำถาม / Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
