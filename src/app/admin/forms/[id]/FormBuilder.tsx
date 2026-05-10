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

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  section,
  sectionNumber,
  onSectionSaved,
  onSectionDeleted,
  isOnly,
  saveAllTrigger,
}: {
  section: SectionWithQuestions;
  sectionNumber: number;
  onSectionSaved: (s: SectionWithQuestions) => void;
  onSectionDeleted: (id: number) => void;
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
  const [questions, setQuestions] = useState<Question[]>(section.questions);
  const [addingQ, setAddingQ] = useState(false);

  const handleSaveSection = async () => {
    setSavingSection(true);
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
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!confirm(`ลบส่วน "${title}"? คำถามทั้งหมดในส่วนนี้จะถูกลบด้วย`)) return;
    await api("DELETE", "/api/sections", { id: section.id });
    onSectionDeleted(section.id);
  };

  const handleAddQuestion = async () => {
    setAddingQ(true);
    try {
      const newQ = await api("POST", "/api/questions", { section_id: section.id });
      setQuestions((prev) => [...prev, newQ]);
    } finally {
      setAddingQ(false);
    }
  };

  const handleQuestionSaved = useCallback((updated: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  }, []);

  const handleQuestionDeleted = useCallback((id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isOnly && (
              <button
                onClick={handleDeleteSection}
                className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50"
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

          {/* Branching logic */}
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

          <div className="flex justify-end">
            <button
              onClick={handleSaveSection}
              disabled={savingSection}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                sectionSaved ? "bg-green-100 text-green-700" : "bg-amber-500 text-white hover:bg-amber-600"
              } disabled:opacity-50`}
            >
              {savingSection ? "กำลังบันทึก..." : sectionSaved ? "✓ บันทึกแล้ว" : "บันทึกการตั้งค่าส่วน"}
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">คำถาม ({questions.length} ข้อ)</h4>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  number={i + 1}
                  onSaved={handleQuestionSaved}
                  onDeleted={handleQuestionDeleted}
                  saveAllTrigger={saveAllTrigger}
                />
              ))}
              {questions.length === 0 && (
                <p className="text-center text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">
                  ยังไม่มีคำถามในส่วนนี้
                </p>
              )}
            </div>
            <button
              onClick={handleAddQuestion}
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

  const handleSectionSaved = useCallback((updated: SectionWithQuestions) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleSectionDeleted = useCallback((id: number) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleAddSection = async () => {
    setAddingSection(true);
    try {
      const newSection = await api("POST", "/api/sections", {
        form_id: form.id,
        title: "ส่วนใหม่",
        description: null,
        minimum_score: null,
        termination_message: null,
      });
      setSections((prev) => [...prev, { ...newSection, questions: [] }]);
    } finally {
      setAddingSection(false);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setSaveAllTrigger((t) => t + 1);
    // Give saves time to complete before resetting the indicator
    await new Promise((r) => setTimeout(r, 1500));
    setSavingAll(false);
  };

  return (
    <div className="space-y-5">
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

      {sections.map((section, i) => (
        <SectionCard
          key={section.id}
          section={section}
          sectionNumber={i + 1}
          onSectionSaved={handleSectionSaved}
          onSectionDeleted={handleSectionDeleted}
          isOnly={sections.length === 1}
          saveAllTrigger={saveAllTrigger}
        />
      ))}

      <button
        onClick={handleAddSection}
        disabled={addingSection}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 text-gray-600 font-medium rounded-2xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
      >
        + {addingSection ? "กำลังเพิ่ม..." : "เพิ่มส่วนใหม่"}
      </button>
    </div>
  );
}
