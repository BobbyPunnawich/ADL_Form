"use client";

import { useState, useCallback } from "react";
import type { FormWithSections, AnswerValue } from "@/types/db";
import AnswerInput, { type Lang } from "@/components/player/AnswerInput";
import NavButton from "@/components/NavButton";
import ProgressBar from "@/components/ProgressBar";
import { calcSectionScore, isQuestionAnswered } from "@/lib/scoring";

type AnswerMap = Record<string, AnswerValue>;

type PageState =
  | { screen: "intro" }
  | { screen: "section"; sectionIdx: number }
  | { screen: "section_break"; nextSectionIdx: number }
  | { screen: "terminated"; message: string }
  | { screen: "done" };

// ─── Language toggle (shared across screens) ──────────────────────────────────

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
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
  );
}

// ─── PlayerClient ─────────────────────────────────────────────────────────────

export default function PlayerClient({ form }: { form: FormWithSections }) {
  const [page, setPage] = useState<PageState>({ screen: "intro" });
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [sectionScores, setSectionScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lang, setLang] = useState<Lang>("th");

  const allSections = form.sections;

  const currentSection = page.screen === "section" ? allSections[page.sectionIdx] : null;

  const handleAnswerChange = useCallback((questionId: number, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId.toString()]: value }));
  }, []);

  const saveResponse = useCallback(async (
    scores: Record<string, number>,
    status: string,
    terminatedAtSection?: number,
  ) => {
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
  }, [form.id, answers]);

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
      setPage({ screen: "section_break", nextSectionIdx: sectionIdx + 1 });
    } else {
      setPage({ screen: "done" });
      saveResponse(newScores, "completed", undefined);
    }
  }, [allSections, answers, sectionScores, saveResponse]);

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (page.screen === "intro") {
    const totalParts = allSections.length;
    return (
      <main className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10">
          <div className="flex justify-end mb-4">
            <LangToggle lang={lang} setLang={setLang} />
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{form.title}</h1>
            {form.description && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">{form.description}</p>
            )}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6 text-left">
              <p className="text-base font-semibold text-blue-800 mb-2">
                {lang === "en" ? `This assessment has ${totalParts} part${totalParts > 1 ? "s" : ""}:` : `แบบสอบถามนี้มีทั้งหมด ${totalParts} ส่วน:`}
              </p>
              <ol className="space-y-1">
                {allSections.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-2 text-base text-blue-700">
                    <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    {s.title} <span className="text-blue-400 text-sm">({s.questions.length} {lang === "en" ? "questions" : "ข้อ"})</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 mb-8 text-left">
              <p className="text-lg text-yellow-800 font-medium">
                {lang === "en"
                  ? "📋 Instructions: Please answer every question honestly. There are no right or wrong answers. You may rest between parts."
                  : "📋 คำแนะนำ: กรุณาตอบคำถามทุกข้อตามความเป็นจริง ไม่มีคำตอบถูกหรือผิด สามารถพักระหว่างส่วนได้"}
              </p>
            </div>
            <NavButton onClick={() => setPage({ screen: "section", sectionIdx: 0 })}>
              {lang === "en" ? "Begin Assessment →" : "เริ่มทำแบบสอบถาม →"}
            </NavButton>
          </div>
        </div>
      </main>
    );
  }

  // ── Section break (pause between parts) ───────────────────────────────────
  if (page.screen === "section_break") {
    const completedIdx = page.nextSectionIdx - 1;
    const completedSection = allSections[completedIdx];
    const nextSection = allSections[page.nextSectionIdx];
    const nextQCount = nextSection.questions.length;
    const totalSections = allSections.length;

    return (
      <main className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10">
          <div className="flex justify-end mb-6">
            <LangToggle lang={lang} setLang={setLang} />
          </div>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-green-700 bg-green-100 px-4 py-1 rounded-full mb-3">
              {lang === "en"
                ? `Part ${completedIdx + 1} of ${totalSections} complete`
                : `ส่วนที่ ${completedIdx + 1} จาก ${totalSections} เสร็จสมบูรณ์`}
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {lang === "en" ? "Well done!" : "เสร็จสิ้นส่วนนี้แล้ว"}
            </h2>
            <p className="text-xl text-gray-500">
              {lang === "en"
                ? `You have completed: ${completedSection.title}`
                : `คุณตอบเสร็จแล้ว: ${completedSection.title}`}
            </p>
          </div>

          <div className="border-t-2 border-dashed border-gray-200 my-6" />

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 mb-8">
            <p className="text-sm font-semibold text-indigo-500 uppercase tracking-wide mb-1">
              {lang === "en" ? "Up next" : "ส่วนถัดไป"}
            </p>
            <h3 className="text-2xl font-bold text-indigo-900 mb-1">{nextSection.title}</h3>
            {nextSection.description && (
              <p className="text-base text-indigo-700 mb-2">{nextSection.description}</p>
            )}
            <p className="text-base text-indigo-600">
              {lang === "en"
                ? `${nextQCount} question${nextQCount !== 1 ? "s" : ""}`
                : `${nextQCount} ข้อ`}
            </p>
          </div>

          <p className="text-center text-gray-400 text-base mb-6">
            {lang === "en"
              ? "Take a moment to rest, then press the button when you are ready."
              : "พักสักครู่ แล้วกดปุ่มเมื่อพร้อมจะเริ่มส่วนถัดไป"}
          </p>

          <NavButton
            onClick={() => setPage({ screen: "section", sectionIdx: page.nextSectionIdx })}
          >
            {lang === "en" ? `Start Part ${page.nextSectionIdx + 1} →` : `เริ่มส่วนที่ ${page.nextSectionIdx + 1} →`}
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
          <div className="flex justify-end mb-4">
            <LangToggle lang={lang} setLang={setLang} />
          </div>
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
    const closingMsg = form.closing_message;
    return (
      <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="flex justify-end mb-4">
            <LangToggle lang={lang} setLang={setLang} />
          </div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {lang === "en" ? "Assessment Complete" : "ทำแบบสอบถามเสร็จสมบูรณ์"}
          </h2>
          {closingMsg ? (
            <p className="text-xl text-gray-700 leading-relaxed mb-8">{closingMsg}</p>
          ) : (
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              {lang === "en"
                ? "Thank you for completing this assessment. Your responses have been recorded."
                : "ขอบคุณที่สละเวลาตอบแบบสอบถาม ข้อมูลของท่านได้รับการบันทึกเรียบร้อยแล้ว"}
            </p>
          )}
          <NavButton
            variant="secondary"
            onClick={() => {
              setAnswers({});
              setSectionScores({});
              setPage({ screen: "intro" });
            }}
          >
            {lang === "en" ? "↺ Take Again" : "↺ ทำแบบสอบถามอีกครั้ง"}
          </NavButton>
        </div>
      </main>
    );
  }

  // ── Section screen (all questions scrollable) ────────────────────────────
  if (!currentSection) return null;

  const sectionIdx = page.sectionIdx;
  const totalSections = allSections.length;
  const totalQuestions = currentSection.questions.length;
  const answeredCount = currentSection.questions.filter(
    (q) => isQuestionAnswered(q, answers[q.id.toString()])
  ).length;
  const requiredUnanswered = currentSection.questions.filter(
    (q) => q.required !== false && !isQuestionAnswered(q, answers[q.id.toString()])
  );
  const canFinish = requiredUnanswered.length === 0;
  const isLastSection = sectionIdx === totalSections - 1;
  const isFirstSection = sectionIdx === 0;

  const finishLabel = isLastSection
    ? (lang === "en" ? "Submit ✓" : "ส่งคำตอบ ✓")
    : (lang === "en" ? "Finish Part →" : "จบส่วนนี้ →");

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-lg text-gray-500 font-medium">{form.title}</p>
            <LangToggle lang={lang} setLang={setLang} />
          </div>
          <ProgressBar
            current={answeredCount}
            total={totalQuestions}
            sectionTitle={currentSection.title}
            partNumber={sectionIdx + 1}
            totalParts={totalSections}
          />
        </div>
      </header>

      <div className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {currentSection.description && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
              <p className="text-lg text-blue-800">{currentSection.description}</p>
            </div>
          )}

          {currentSection.questions.map((question, qi) => {
            const answer = answers[question.id.toString()];
            const isRequired = question.required !== false;
            const answered = isQuestionAnswered(question, answer);
            return (
              <div
                key={question.id}
                className={`bg-white rounded-3xl shadow-lg p-8 border-2 transition-colors ${
                  answered ? "border-green-200" : "border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                    {lang === "en" ? `Question ${qi + 1}` : `ข้อที่ ${qi + 1}`}
                  </p>
                  {!isRequired && (
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {lang === "en" ? "Optional" : "ไม่บังคับ"}
                    </span>
                  )}
                  {answered && (
                    <span className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-snug">
                  {lang === "en" && question.text_en ? question.text_en : question.text}
                </h2>
                <AnswerInput
                  question={question}
                  answer={answer}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                  lang={lang}
                />
              </div>
            );
          })}

          {!canFinish && (
            <p className="text-center text-sm text-gray-400">
              {lang === "en"
                ? `${requiredUnanswered.length} required question${requiredUnanswered.length > 1 ? "s" : ""} remaining`
                : `ยังเหลืออีก ${requiredUnanswered.length} ข้อที่ต้องตอบ`}
            </p>
          )}

          <div className="flex justify-between gap-4 pt-2 pb-8">
            <NavButton
              onClick={() => setPage({ screen: "section", sectionIdx: sectionIdx - 1 })}
              variant="secondary"
              disabled={isFirstSection}
            >
              {lang === "en" ? "← Back" : "← ย้อนกลับ"}
            </NavButton>
            <NavButton
              onClick={() => finishSection(sectionIdx)}
              disabled={!canFinish || submitting}
            >
              {submitting ? (lang === "en" ? "Saving..." : "กำลังบันทึก...") : finishLabel}
            </NavButton>
          </div>
        </div>
      </div>
    </main>
  );
}
