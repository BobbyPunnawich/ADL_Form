"use client";

import type {
  Question, AnswerValue,
  ChoiceOption, ChoiceOptions, TextOptions, ScaleOptions, GridOptions,
} from "@/types/db";

export type Lang = "th" | "en";

const LETTERS = ["ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ"];

function optLabel(opt: ChoiceOption, lang: Lang) {
  return lang === "en" && opt.label_en ? opt.label_en : opt.label;
}

// ─── Multiple Choice (large card style) ──────────────────────────────────────

function MultipleChoiceInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const options = question.options as ChoiceOptions;
  return (
    <div className="space-y-4">
      {options.map((opt, i) => {
        const selected = answer?.optionIndex === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange({ score: opt.score, optionIndex: i })}
            className={`w-full text-left rounded-2xl px-6 py-5 flex items-center gap-5 transition-all ${
              selected
                ? "bg-blue-600 border-4 border-blue-800 text-white shadow-lg"
                : "bg-white border-4 border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-blue-50"
            }`}
            style={{ minHeight: 88 }}
          >
            <span className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 ${selected ? "bg-white text-blue-700 border-blue-700" : "bg-gray-100 text-gray-600 border-gray-300"}`}>
              {LETTERS[i] ?? i + 1}
            </span>
            <span className="text-xl leading-relaxed font-medium">{optLabel(opt, lang)}</span>
            {selected && (
              <span className="ml-auto flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Radio ────────────────────────────────────────────────────────────────────

function RadioInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const options = question.options as ChoiceOptions;
  return (
    <div className="space-y-3">
      {options.map((opt, i) => {
        const selected = answer?.optionIndex === i;
        return (
          <label
            key={i}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              selected ? "border-blue-600 bg-blue-600" : "border-gray-400"
            }`}>
              {selected && <div className="w-3 h-3 rounded-full bg-white" />}
            </div>
            <input type="radio" className="sr-only" checked={selected} onChange={() => onChange({ score: opt.score, optionIndex: i })} />
            <span className="text-xl text-gray-800">{optLabel(opt, lang)}</span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Checkbox ────────────────────────────────────────────────────────────────

function CheckboxInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const options = question.options as ChoiceOptions;
  const selected = new Set(answer?.selectedIndices ?? []);

  const toggle = (i: number) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    const arr = Array.from(next);
    const score = arr.reduce((s, idx) => s + (options[idx]?.score ?? 0), 0);
    onChange({ score, selectedIndices: arr });
  };

  return (
    <div className="space-y-3">
      {options.map((opt, i) => {
        const checked = selected.has(i);
        return (
          <label
            key={i}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              checked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center ${
              checked ? "border-blue-600 bg-blue-600" : "border-gray-400"
            }`}>
              {checked && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(i)} />
            <span className="text-xl text-gray-800">{optLabel(opt, lang)}</span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

function DropdownInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const options = question.options as ChoiceOptions;
  const placeholder = lang === "en" ? "— Please select —" : "— กรุณาเลือก —";
  return (
    <div>
      <select
        value={answer?.optionIndex ?? ""}
        onChange={(e) => {
          const i = parseInt(e.target.value);
          onChange({ score: options[i]?.score ?? 0, optionIndex: i });
        }}
        className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl text-gray-800 bg-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
        style={{ minHeight: 72 }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt, i) => (
          <option key={i} value={i}>{optLabel(opt, lang)}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Short Answer ─────────────────────────────────────────────────────────────

function ShortAnswerInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const opts = question.options as TextOptions;
  const placeholder =
    (lang === "en" ? opts.placeholder_en : opts.placeholder) ||
    (lang === "en" ? "Type your answer here..." : "พิมพ์คำตอบของท่านที่นี่...");
  return (
    <input
      type="text"
      value={answer?.text ?? ""}
      onChange={(e) => onChange({ score: 0, text: e.target.value })}
      placeholder={placeholder}
      className="w-full border-2 border-gray-300 rounded-2xl px-6 py-5 text-xl text-gray-800 focus:border-blue-500 focus:outline-none"
      style={{ minHeight: 72 }}
    />
  );
}

// ─── Long Answer ──────────────────────────────────────────────────────────────

function LongAnswerInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const opts = question.options as TextOptions;
  const placeholder =
    (lang === "en" ? opts.placeholder_en : opts.placeholder) ||
    (lang === "en" ? "Type your answer here..." : "พิมพ์คำตอบของท่านที่นี่...");
  return (
    <textarea
      value={answer?.text ?? ""}
      onChange={(e) => onChange({ score: 0, text: e.target.value })}
      placeholder={placeholder}
      rows={5}
      className="w-full border-2 border-gray-300 rounded-2xl px-6 py-4 text-xl text-gray-800 focus:border-blue-500 focus:outline-none resize-none"
    />
  );
}

// ─── Linear Scale ─────────────────────────────────────────────────────────────

function LinearScaleInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const opts = question.options as ScaleOptions;
  const nums = Array.from({ length: opts.max - opts.min + 1 }, (_, i) => opts.min + i);
  const minLbl = lang === "en" ? (opts.minLabel_en || opts.minLabel) : opts.minLabel;
  const maxLbl = lang === "en" ? (opts.maxLabel_en || opts.maxLabel) : opts.maxLabel;

  return (
    <div>
      <div className="flex gap-2 justify-between flex-wrap">
        {nums.map((n) => {
          const selected = answer?.scaleValue === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ score: n, scaleValue: n })}
              className={`flex-1 min-w-[52px] flex flex-col items-center justify-center rounded-2xl py-4 border-4 text-2xl font-bold transition-all ${
                selected
                  ? "bg-blue-600 border-blue-800 text-white shadow-lg"
                  : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
              }`}
              style={{ minHeight: 80 }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 px-1">
        <span className="text-base text-gray-500">{minLbl}</span>
        <span className="text-base text-gray-500">{maxLbl}</span>
      </div>
    </div>
  );
}

// ─── Radio Grid ───────────────────────────────────────────────────────────────

function RadioGridInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const opts = question.options as GridOptions;
  const rowSel = answer?.rowSelections ?? {};

  const select = (rowIdx: number, colIdx: number) => {
    const next = { ...rowSel, [rowIdx.toString()]: colIdx };
    const score = Object.values(next).reduce((s, ci) => s + (opts.columns[ci]?.score ?? 0), 0);
    onChange({ score, rowSelections: next });
  };

  const rowLabel = (i: number) =>
    lang === "en" ? (opts.rows_en?.[i] || opts.rows[i]) : opts.rows[i];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left pb-3 pr-4 text-base font-medium text-gray-500 min-w-[140px]" />
            {opts.columns.map((col, ci) => (
              <th key={ci} className="text-center pb-3 px-3 text-lg font-semibold text-gray-700 min-w-[80px]">
                {optLabel(col, lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {opts.rows.map((_, ri) => {
            const selectedCol = rowSel[ri.toString()];
            return (
              <tr key={ri} className={ri % 2 === 0 ? "bg-gray-50 rounded-xl" : ""}>
                <td className="py-3 pr-4 text-lg text-gray-800 font-medium">{rowLabel(ri)}</td>
                {opts.columns.map((__, ci) => {
                  const selected = selectedCol === ci;
                  return (
                    <td key={ci} className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => select(ri, ci)}
                        className={`w-10 h-10 rounded-full border-4 flex items-center justify-center mx-auto transition-all ${
                          selected ? "bg-blue-600 border-blue-800" : "bg-white border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {selected && <div className="w-4 h-4 rounded-full bg-white" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Checkbox Grid ────────────────────────────────────────────────────────────

function CheckboxGridInput({
  question, answer, onChange, lang,
}: {
  question: Question; answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void; lang: Lang;
}) {
  const opts = question.options as GridOptions;
  const rowSel = answer?.rowMultiSelections ?? {};

  const toggle = (rowIdx: number, colIdx: number) => {
    const prev = new Set(rowSel[rowIdx.toString()] ?? []);
    prev.has(colIdx) ? prev.delete(colIdx) : prev.add(colIdx);
    const next = { ...rowSel, [rowIdx.toString()]: Array.from(prev) };
    const score = Object.values(next).reduce(
      (s, cols) => s + cols.reduce((cs, ci) => cs + (opts.columns[ci]?.score ?? 0), 0),
      0
    );
    onChange({ score, rowMultiSelections: next });
  };

  const rowLabel = (i: number) =>
    lang === "en" ? (opts.rows_en?.[i] || opts.rows[i]) : opts.rows[i];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left pb-3 pr-4 text-base font-medium text-gray-500 min-w-[140px]" />
            {opts.columns.map((col, ci) => (
              <th key={ci} className="text-center pb-3 px-3 text-lg font-semibold text-gray-700 min-w-[80px]">
                {optLabel(col, lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {opts.rows.map((_, ri) => {
            const selectedCols = new Set(rowSel[ri.toString()] ?? []);
            return (
              <tr key={ri} className={ri % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="py-3 pr-4 text-lg text-gray-800 font-medium">{rowLabel(ri)}</td>
                {opts.columns.map((__, ci) => {
                  const checked = selectedCols.has(ci);
                  return (
                    <td key={ci} className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(ri, ci)}
                        className={`w-10 h-10 rounded-lg border-4 flex items-center justify-center mx-auto transition-all ${
                          checked ? "bg-blue-600 border-blue-800" : "bg-white border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {checked && (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── AnswerInput (dispatch) ───────────────────────────────────────────────────

export default function AnswerInput({
  question,
  answer,
  onChange,
  lang = "th",
}: {
  question: Question;
  answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void;
  lang?: Lang;
}) {
  const props = { question, answer, onChange, lang };
  switch (question.type) {
    case "multiple_choice": return <MultipleChoiceInput {...props} />;
    case "radio":           return <RadioInput {...props} />;
    case "checkbox":        return <CheckboxInput {...props} />;
    case "dropdown":        return <DropdownInput {...props} />;
    case "short_answer":    return <ShortAnswerInput {...props} />;
    case "long_answer":     return <LongAnswerInput {...props} />;
    case "linear_scale":    return <LinearScaleInput {...props} />;
    case "radio_grid":      return <RadioGridInput {...props} />;
    case "checkbox_grid":   return <CheckboxGridInput {...props} />;
    default:                return null;
  }
}
