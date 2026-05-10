"use client";

import { useState, useCallback } from "react";
import type { FormWithSections, SectionWithQuestions, AnswerValue } from "@/types/db";
import AnswerInput, { type Lang } from "@/components/player/AnswerInput";
import NavButton from "@/components/NavButton";
import ProgressBar from "@/components/ProgressBar";
import { calcSectionScore, isQuestionAnswered } from "@/lib/scoring";

type AnswerMap = Record<string, AnswerValue>;

type PageState =
  | { screen: "intro" }
  | { screen: "question"; sectionIdx: number; questionIdx: number }
  | { screen: "terminated"; message: string }
  | { screen: "done" };

export default function PlayerClient({ form }: { form: FormWithSections }) {
  const [page, setPage] = useState<PageState>({ screen: "intro" });
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [sectionScores, setSectionScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lang, setLang] = useState<Lang>("th");

  const allSections = form.sections;
  const flatQuestions = allSections.flatMap((s) => s.questions.map((q) => ({ question: q, section: s })));

  const currentSection = page.screen === "question" ? allSections[page.sectionIdx] : null;
  const currentQuestion = page.screen === "question" ? currentSection?.questions[page.questionIdx] ?? null : null;
  const totalQuestionsInSection = currentSection?.questions.length ?? 0;

  const handleAnswerChange = useCallback((questionId: number, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId.toString()]: value }));
  }, []);

  const finishSection = useCallback(async (sectionIdx: number) => {
    const section = allSections[sectionIdx];
    const score = calcSectionScore(section.questions, answers);
    const newScores = { ...sectionScores, [section.id.toString()]: score };
    setSectionScores(newScores);

    const minScore = section.minimum_score;
    const fails = minScore !== null && minScore > 0 && score < minScore;

    if (fails) {
      await saveResponse(newScores, "terminated", section.id);
      setPage({
        screen: "terminated",
        message: section.termination_message ??
          "ขอบคุณสำหรับการตอบแบบสอบถาม คะแนนของท่านไม่ผ่านเกณฑ์ขั้นต่ำสำหรับส่วนนี้",
      });
      return;
    }

    if (sectionIdx + 1 < allSections.length) {
      setPage({ screen: "question", sectionIdx: sectionIdx + 1, questionIdx: 0 });
    } else {
      await saveResponse(newScores, "completed", undefined);
      setPage({ screen: "done" });
    }
  }, [allSections, answers, sectionScores]);

  const saveResponse = async (scores: Record<string, number>, status: string, terminatedAtSection?: number) => {
    setSubmitting(true);
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formId: form.id,
        sessionId,
        answers,
        sectionScores: scores,
        totalScore: total,
        status,
        terminatedAtSection: terminatedAtSection ?? null,
      }),
    });
    setSubmitting(false);
  };

  const handleNext = () => {
    if (page.screen !== "question") return;
    const { sectionIdx, questionIdx } = page;
    const section = allSections[sectionIdx];
    if (questionIdx + 1 < section.questions.length) {
      setPage({ screen: "question", sectionIdx, questionIdx: questionIdx + 1 });
    } else {
      finishSection(sectionIdx);
    }
  };

  const handleBack = () => {
    if (page.screen !== "question") return;
    const { sectionIdx, questionIdx } = page;
    if (questionIdx > 0) {
      setPage({ screen: "question", sectionIdx, questionIdx: questionIdx - 1 });
    } else if (sectionIdx > 0) {
      const prevSection = allSections[sectionIdx - 1];
      setPage({ screen: "question", sectionIdx: sectionIdx - 1, questionIdx: prevSection.questions.length - 1 });
    }
  };

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (page.screen === "intro") {
    return (
      <main className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{form.title}</h1>
          {form.description && <p className="text-xl text-gray-600 mb-8 leading-relaxed">{form.description}</p>}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 mb-8 text-left">
            <p className="text-lg text-yellow-800 font-medium">
              📋 คำแนะนำ: กรุณาตอบคำถามทุกข้อตามความเป็นจริง ไม่มีคำตอบถูกหรือผิด
            </p>
          </div>
          <NavButton onClick={() => setPage({ screen: "question", sectionIdx: 0, questionIdx: 0 })}>
            เริ่มทำแบบสอบถาม →
          </NavButton>
        </div>
      </main>
    );
  }

  // ── Terminated ────────────────────────────────────────────────────────────
  if (page.screen === "terminated") {
    return (
      <main className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">ขอบคุณสำหรับการตอบแบบสอบถาม</h2>
          <p className="text-xl text-gray-700 leading-relaxed">{page.message}</p>
        </div>
      </main>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (page.screen === "done") {
    return (
      <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">ทำแบบสอบถามเสร็จสมบูรณ์</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            ขอบคุณที่สละเวลาตอบแบบสอบถาม ข้อมูลของท่านได้รับการบันทึกเรียบร้อยแล้ว
          </p>
        </div>
      </main>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────
  if (!currentSection || !currentQuestion) return null;

  const globalCurrent =
    allSections.slice(0, page.sectionIdx).reduce((s, sec) => s + sec.questions.length, 0) +
    page.questionIdx + 1;
  const globalTotal = flatQuestions.length;
  const isFirstQuestion = page.sectionIdx === 0 && page.questionIdx === 0;
  const isLastInSection = page.questionIdx === totalQuestionsInSection - 1;
  const isLastSection = page.sectionIdx === allSections.length - 1;
  const isLastQuestion = isLastInSection && isLastSection;

  const currentAnswer = answers[currentQuestion.id.toString()];
  const canProceed = isQuestionAnswered(currentQuestion, currentAnswer);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b-2 border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-lg text-gray-500 font-medium">{form.title}</p>
            {/* Language toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setLang("th")}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  lang === "th" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                ภาษาไทย
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  lang === "en" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                English
              </button>
            </div>
          </div>
          <ProgressBar
            current={globalCurrent}
            total={globalTotal}
            sectionTitle={currentSection.title}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-3xl w-full">
          {page.questionIdx === 0 && currentSection.description && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-6">
              <p className="text-lg text-blue-800">{currentSection.description}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
              คำถามที่ {globalCurrent} จาก {globalTotal}
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 leading-snug">
              {lang === "en" && currentQuestion.text_en
                ? currentQuestion.text_en
                : currentQuestion.text}
            </h2>
            <AnswerInput
              question={currentQuestion}
              answer={currentAnswer}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              lang={lang}
            />
          </div>

          <div className="flex justify-between gap-4">
            <NavButton onClick={handleBack} variant="secondary" disabled={isFirstQuestion}>
              ← ย้อนกลับ
            </NavButton>
            <NavButton onClick={handleNext} disabled={!canProceed || submitting}>
              {submitting ? "กำลังบันทึก..." : isLastQuestion ? "ส่งคำตอบ ✓" : isLastInSection ? "ไปส่วนถัดไป →" : "ถัดไป →"}
            </NavButton>
          </div>
        </div>
      </div>
    </main>
  );
}
