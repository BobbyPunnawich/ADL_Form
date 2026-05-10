"use client";

import { useState } from "react";
import type { Section, Question } from "@/db/schema";

type SectionWithQuestions = Section & { questions: Question[] };

export default function SectionEditor({ section }: { section: SectionWithQuestions }) {
  const [minScore, setMinScore] = useState<string>(
    section.minimumScore?.toString() ?? ""
  );
  const [termMsg, setTermMsg] = useState(section.terminationMessage ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: section.id,
        title: section.title,
        description: section.description,
        minimumScore: minScore ? parseInt(minScore) : null,
        terminationMessage: termMsg || null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {section.questions.length} คำถาม
            {section.minimumScore !== null && section.minimumScore !== undefined && (
              <span className="ml-3 text-orange-600 font-medium">
                คะแนนขั้นต่ำ: {section.minimumScore} คะแนน
              </span>
            )}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-6 py-5">
          {/* Section logic settings */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
            <h4 className="font-semibold text-orange-800 mb-4">
              ⚙️ ตั้งค่า Branching Logic
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คะแนนขั้นต่ำ (หากต่ำกว่านี้จะหยุดการประเมิน)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  placeholder="ไม่กำหนด"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-base focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ข้อความเมื่อหยุดการประเมิน
                </label>
                <textarea
                  value={termMsg}
                  onChange={(e) => setTermMsg(e.target.value)}
                  rows={2}
                  placeholder="ขอบคุณสำหรับการตอบแบบสอบถาม..."
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-base focus:border-orange-400 focus:outline-none resize-none"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : saved ? "✓ บันทึกแล้ว" : "บันทึกการตั้งค่า"}
            </button>
          </div>

          {/* Questions list */}
          <div className="space-y-3">
            {section.questions.map((q, i) => (
              <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                <p className="font-medium text-gray-800 mb-2">{q.text}</p>
                <div className="space-y-1">
                  {q.options.map((opt, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {j + 1}
                      </span>
                      <span className="flex-1">{opt.label}</span>
                      <span className="text-blue-600 font-semibold">{opt.score} คะแนน</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
