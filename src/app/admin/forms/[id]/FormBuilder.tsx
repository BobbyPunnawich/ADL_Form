"use client";

import { useState, useCallback } from "react";
import type { FormWithSections, SectionWithQuestions, Question } from "@/types/db";
import QuestionEditor from "./QuestionEditor";

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Insert divider (between sections / between questions) ────────────────────

function InsertDivider({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 group py-0.5">
      <div className="flex-1 h-px bg-gray-200 group-hover:bg-blue-300 transition-colors" />
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {label}
      </button>
      <div className="flex-1 h-px bg-gray-200 group-hover:bg-blue-300 transition-colors" />
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  section,
  sectionNumber,
  onSectionSaved,
  onSectionDeleted,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isOnly,
  saveAllTrigger,
}: {
  section: SectionWithQuestions;
  sectionNumber: number;
  onSectionSaved: (s: SectionWithQuestions) => void;
  onSectionDeleted: (id: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isOnly: boolean;
  saveAllTrigger: number;
}) {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? "");
  const [minScore, setMinScore] = useState<string>(
    section.minimum_score !== null && section.minimum_score !== undefined
      ? String(section.minimum_score)
      : ""
  );
  const [termMsg, setTermMsg] = useState(section.termination_message ?? "");
  const [savingSection, setSavingSection] = useState(false);
  const [sectionSaved, setSectionSaved] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>(section.questions);
  const [addingQ, setAddingQ] = useState(false);

  const handleSaveSection = async () => {
    setSavingSection(true);
    setSectionError(null);
    try {
      const updated = await api("PUT", "/api/sections", {
        id: section.id,
        title,
        description: description || null,
        minimum_score: minScore !== "" ? parseInt(minScore) : null,
        termination_message: termMsg || null,
      });
      onSectionSaved({ ...updated, questions });
      setSectionSaved(true);
      setTimeout(() => setSectionSaved(false), 2000);
    } catch (e) {
      setSectionError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!confirm(`ลบส่วน "${title}"? คำถามทั้งหมดในส่วนนี้จะถูกลบด้วย`)) return;
    await api("DELETE", "/api/sections", { id: section.id });
    onSectionDeleted(section.id);
  };

  // Insert a new question before the given index (questions.length = append)
  const handleAddQuestion = async (insertBefore: number) => {
    setAddingQ(true);
    try {
      const newQ = await api("POST", "/api/questions", { section_id: section.id });
      setQuestions((prev) => {
        const next = [...prev];
        next.splice(insertBefore, 0, newQ);
        const updates = next.map((q, i) => ({ id: q.id, order: i + 1 }));
        api("PATCH", "/api/questions", { updates });
        return next;
      });
    } finally {
      setAddingQ(false);
    }
  };

  const moveQuestionUp = (idx: number) => {
    if (idx === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      const updates = next.map((q, i) => ({ id: q.id, order: i + 1 }));
      api("PATCH", "/api/questions", { updates });
      return next;
    });
  };

  const moveQuestionDown = (idx: number) => {
    setQuestions((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      const updates = next.map((q, i) => ({ id: q.id, order: i + 1 }));
      api("PATCH", "/api/questions", { updates });
      return next;
    });
  };

  const handleQuestionSaved = useCallback((updated: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  }, []);

  const handleQuestionDeleted = useCallback((id: number) => {
    setQuestions((prev) => {
      const next = prev.filter((q) => q.id !== id);
      if (next.length > 0) {
        const updates = next.map((q, i) => ({ id: q.id, order: i + 1 }));
        api("PATCH", "/api/questions", { updates });
      }
      return next;
    });
  }, []);

  // Insert duplicate immediately after the original question
  const handleQuestionDuplicated = useCallback((sourceId: number, newQ: Question) => {
    setQuestions((prev) => {
      const sourceIdx = prev.findIndex((q) => q.id === sourceId);
      const next = [...prev];
      next.splice(sourceIdx + 1, 0, newQ);
      const updates = next.map((q, i) => ({ id: q.id, order: i + 1 }));
      api("PATCH", "/api/questions", { updates });
      return next;
    });
  }, []);

  const hasMinScore = minScore !== "" && parseInt(minScore) > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="border-b border-gray-100">
        <div className="flex items-center px-5 py-4 gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
            {sectionNumber}
          </span>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-gray-900 border-none outline-none bg-transparent focus:bg-gray-50 rounded-lg px-2 py-1 -mx-2"
            />
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 px-2">
              <span>{questions.length} คำถาม</span>
              {hasMinScore ? (
                <span className="text-orange-600 font-medium">คะแนนขั้นต่ำ: {minScore}</span>
              ) : (
                <span className="text-gray-400">ไม่มีคะแนนขั้นต่ำ</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Move up/down */}
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              title="ย้ายส่วนขึ้น"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              title="ย้ายส่วนลง"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {!isOnly && (
              <button
                onClick={handleDeleteSection}
                className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 ml-1"
              >
                ลบส่วน
              </button>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
            >
              <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              คำอธิบายส่วน
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="คำแนะนำสำหรับส่วนนี้..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-base focus:border-blue-400 focus:outline-none resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
              ⚡ เงื่อนไขการผ่านส่วน (Branching Logic)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  คะแนนขั้นต่ำในการผ่าน <span className="text-gray-400">(0 = ไม่มีเงื่อนไข)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  placeholder="0"
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-base focus:border-amber-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ข้อความเมื่อไม่ผ่านเกณฑ์
                </label>
                <textarea
                  value={termMsg}
                  onChange={(e) => setTermMsg(e.target.value)}
                  rows={2}
                  placeholder="ขอบคุณสำหรับการตอบแบบสอบถาม..."
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-base focus:border-amber-500 focus:outline-none resize-none bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              {sectionError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  ⚠ {sectionError}
                </p>
              )}
            </div>
            <button
              onClick={handleSaveSection}
              disabled={savingSection}
              className={`ml-3 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                sectionSaved ? "bg-green-100 text-green-700" : "bg-amber-500 text-white hover:bg-amber-600"
              } disabled:opacity-50`}
            >
              {savingSection ? "กำลังบันทึก..." : sectionSaved ? "✓ บันทึกแล้ว" : "บันทึกการตั้งค่าส่วน"}
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">คำถาม ({questions.length} ข้อ)</h4>

            {/* Insert before first question */}
            {questions.length > 0 && (
              <div className="mb-2">
                <InsertDivider
                  label="แทรกคำถามตรงนี้"
                  onClick={() => handleAddQuestion(0)}
                  disabled={addingQ}
                />
              </div>
            )}

            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={q.id}>
                  <QuestionEditor
                    question={q}
                    number={i + 1}
                    onSaved={handleQuestionSaved}
                    onDeleted={handleQuestionDeleted}
                    onDuplicated={(newQ) => handleQuestionDuplicated(q.id, newQ)}
                    onMoveUp={() => moveQuestionUp(i)}
                    onMoveDown={() => moveQuestionDown(i)}
                    canMoveUp={i > 0}
                    canMoveDown={i < questions.length - 1}
                    saveAllTrigger={saveAllTrigger}
                  />
                  {/* Insert after this question */}
                  <div className="mt-2">
                    <InsertDivider
                      label="แทรกคำถามตรงนี้"
                      onClick={() => handleAddQuestion(i + 1)}
                      disabled={addingQ}
                    />
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <p className="text-center text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">
                  ยังไม่มีคำถามในส่วนนี้
                </p>
              )}
            </div>

            <button
              onClick={() => handleAddQuestion(questions.length)}
              disabled={addingQ}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 font-medium rounded-xl hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 text-sm"
            >
              + {addingQ ? "กำลังเพิ่ม..." : "เพิ่มคำถามใหม่"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FormBuilder root ─────────────────────────────────────────────────────────

export default function FormBuilder({ form }: { form: FormWithSections }) {
  const [sections, setSections] = useState<SectionWithQuestions[]>(form.sections);
  const [addingSection, setAddingSection] = useState(false);
  const [saveAllTrigger, setSaveAllTrigger] = useState(0);
  const [savingAll, setSavingAll] = useState(false);

  const [closingMessage, setClosingMessage] = useState(form.closing_message ?? "");
  const [savingForm, setSavingForm] = useState(false);
  const [formSaved, setFormSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSectionSaved = useCallback((updated: SectionWithQuestions) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleSectionDeleted = useCallback((id: number) => {
    setSections((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length > 0) {
        const updates = next.map((s, i) => ({ id: s.id, order: i + 1 }));
        api("PATCH", "/api/sections", { updates, form_id: form.id });
      }
      return next;
    });
  }, [form.id]);

  // Insert a new section before the given index (sections.length = append)
  const handleAddSection = async (insertBefore: number) => {
    setAddingSection(true);
    try {
      const newSection = await api("POST", "/api/sections", {
        form_id: form.id,
        title: "ส่วนใหม่",
        description: null,
        minimum_score: null,
        termination_message: null,
      });
      setSections((prev) => {
        const next = [...prev];
        next.splice(insertBefore, 0, { ...newSection, questions: [] });
        const updates = next.map((s, i) => ({ id: s.id, order: i + 1 }));
        api("PATCH", "/api/sections", { updates, form_id: form.id });
        return next;
      });
    } finally {
      setAddingSection(false);
    }
  };

  const moveSectionUp = (idx: number) => {
    if (idx === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      const updates = next.map((s, i) => ({ id: s.id, order: i + 1 }));
      api("PATCH", "/api/sections", { updates, form_id: form.id });
      return next;
    });
  };

  const moveSectionDown = (idx: number) => {
    setSections((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      const updates = next.map((s, i) => ({ id: s.id, order: i + 1 }));
      api("PATCH", "/api/sections", { updates, form_id: form.id });
      return next;
    });
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setSaveAllTrigger((t) => t + 1);
    await new Promise((r) => setTimeout(r, 1500));
    setSavingAll(false);
  };

  const handleSaveForm = async () => {
    setSavingForm(true);
    setFormError(null);
    try {
      await api("PUT", `/api/forms/${form.id}`, {
        title: form.title,
        description: form.description,
        closing_message: closingMessage || null,
      });
      setFormSaved(true);
      setTimeout(() => setFormSaved(false), 2000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Form-level settings */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-bold text-gray-700">การตั้งค่าแบบสอบถาม / Form Settings</span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              ข้อความสรุปท้ายแบบสอบถาม / Closing Message
            </label>
            <textarea
              value={closingMessage}
              onChange={(e) => setClosingMessage(e.target.value)}
              rows={3}
              placeholder="ขอบคุณที่ร่วมตอบแบบสอบถาม... / Thank you for completing this assessment..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:border-blue-400 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              ข้อความนี้จะแสดงเมื่อผู้ตอบทำแบบสอบถามครบทุกส่วนแล้ว / Shown on the final completion screen
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  ⚠ {formError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 ml-3">
              {formSaved && <span className="text-sm text-green-600 font-medium">✓ บันทึกแล้ว</span>}
              <button
                onClick={handleSaveForm}
                disabled={savingForm}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  formSaved ? "bg-green-100 text-green-700" : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-50`}
              >
                {savingForm ? "กำลังบันทึก..." : formSaved ? "✓ บันทึกแล้ว" : "บันทึก / Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save All toolbar */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
        <p className="text-sm text-gray-500">
          คำถามที่มี{" "}
          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            กรอบสีเหลือง
          </span>{" "}
          ยังไม่ได้บันทึก / Questions with an amber border are unsaved
        </p>
        <button
          onClick={handleSaveAll}
          disabled={savingAll}
          className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 transition-colors"
        >
          {savingAll ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              กำลังบันทึกทั้งหมด...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              บันทึกทั้งหมด / Save All Changes
            </>
          )}
        </button>
      </div>

      {/* Flow summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">ลำดับการประเมิน</p>
        <div className="flex items-center gap-2 flex-wrap">
          {sections.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm">
                <span className="font-bold text-blue-700">ส่วน {i + 1}</span>
                {s.minimum_score !== null && s.minimum_score > 0 ? (
                  <span className="text-orange-600 font-medium">≥{s.minimum_score} คะแนน</span>
                ) : (
                  <span className="text-gray-400">ไม่มีเงื่อนไข</span>
                )}
              </div>
              {i < sections.length - 1 && (
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
          {sections.length === 0 && <span className="text-blue-400 text-sm">ยังไม่มีส่วน</span>}
        </div>
      </div>

      {/* Insert before first section */}
      <InsertDivider
        label="เพิ่มส่วนที่นี่"
        onClick={() => handleAddSection(0)}
        disabled={addingSection}
      />

      {sections.map((section, i) => (
        <div key={section.id}>
          <SectionCard
            section={section}
            sectionNumber={i + 1}
            onSectionSaved={handleSectionSaved}
            onSectionDeleted={handleSectionDeleted}
            onMoveUp={() => moveSectionUp(i)}
            onMoveDown={() => moveSectionDown(i)}
            canMoveUp={i > 0}
            canMoveDown={i < sections.length - 1}
            isOnly={sections.length === 1}
            saveAllTrigger={saveAllTrigger}
          />
          {/* Insert after this section */}
          <div className="mt-4">
            <InsertDivider
              label={i === sections.length - 1 ? "+ เพิ่มส่วนใหม่" : "เพิ่มส่วนที่นี่"}
              onClick={() => handleAddSection(i + 1)}
              disabled={addingSection}
            />
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <button
          onClick={() => handleAddSection(0)}
          disabled={addingSection}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 text-gray-600 font-medium rounded-2xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        >
          + {addingSection ? "กำลังเพิ่ม..." : "เพิ่มส่วนแรก"}
        </button>
      )}
    </div>
  );
}
