export const dynamic = "force-dynamic";

import { getDB } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { AnswerValue, ChoiceOptions, GridOptions, ScaleOptions } from "@/types/db";

// ─── helpers ─────────────────────────────────────────────────────────────────

function readableAnswer(question: any, answer: AnswerValue | undefined) {
  if (!answer) return null;
  const opts = question.options;

  switch (question.type) {
    case "multiple_choice":
    case "radio":
    case "dropdown": {
      if (answer.optionIndex === undefined) return null;
      const opt = (opts as ChoiceOptions)[answer.optionIndex];
      return { type: "choice" as const, label: opt?.label ?? "", score: answer.score };
    }
    case "checkbox": {
      const choices = opts as ChoiceOptions;
      const labels = (answer.selectedIndices ?? []).map((i) => choices[i]?.label ?? "").filter(Boolean);
      return { type: "choice" as const, label: labels.join(", "), score: answer.score };
    }
    case "short_answer":
    case "long_answer":
      return { type: "text" as const, label: answer.text ?? "", score: answer.score };
    case "linear_scale": {
      const s = opts as ScaleOptions;
      return {
        type: "scale" as const,
        label: String(answer.scaleValue ?? ""),
        min: s.min,
        max: s.max,
        value: answer.scaleValue ?? 0,
        score: answer.score,
      };
    }
    case "radio_grid": {
      const grid = opts as GridOptions;
      const rows = grid.rows.map((row, ri) => {
        const ci = answer.rowSelections?.[ri.toString()];
        return { row, col: ci !== undefined ? (grid.columns[ci]?.label ?? "—") : "—" };
      });
      return { type: "grid" as const, rows, score: answer.score };
    }
    case "checkbox_grid": {
      const grid = opts as GridOptions;
      const rows = grid.rows.map((row, ri) => {
        const cis = answer.rowMultiSelections?.[ri.toString()] ?? [];
        const cols = cis.map((ci) => grid.columns[ci]?.label ?? "").filter(Boolean);
        return { row, col: cols.length ? cols.join(", ") : "—" };
      });
      return { type: "grid" as const, rows, score: answer.score };
    }
    default:
      return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  const { formId, responseId } = await params;
  const db = getDB();

  const { data: form, error: formErr } = await db
    .from("forms")
    .select("*")
    .eq("id", parseInt(formId))
    .single();
  if (formErr || !form) notFound();

  const { data: response, error: respErr } = await db
    .from("responses")
    .select("*")
    .eq("id", parseInt(responseId))
    .single();
  if (respErr || !response) notFound();

  const { data: sections } = await db
    .from("sections")
    .select("*, questions(*)")
    .eq("form_id", parseInt(formId))
    .order("order");

  const sortedSections = (sections ?? []).map((s: any) => ({
    ...s,
    questions: [...(s.questions ?? [])].sort((a: any, b: any) => a.order - b.order),
  }));

  const answers = response.answers as Record<string, AnswerValue>;
  const sectionScores = response.section_scores as Record<string, number>;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href={`/admin/results/${formId}`}
            className="text-gray-400 hover:text-gray-700"
          >
            ← กลับ
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายละเอียดคำตอบ</h1>
            <p className="text-gray-500 text-sm mt-0.5">{form.title}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Session info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Session ID</p>
              <p className="font-mono font-medium text-gray-800 break-all">{response.session_id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">วันที่ / Date</p>
              <p className="text-gray-800">
                {new Date(response.submitted_at).toLocaleString("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">สถานะ / Status</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                response.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}>
                {response.status === "completed" ? "ครบทุกส่วน" : "หยุดก่อนกำหนด"}
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">คะแนนรวม / Total</p>
              <p className="text-2xl font-bold text-gray-900">{response.total_score}</p>
            </div>
          </div>
        </div>

        {/* Per-section answers */}
        {sortedSections.map((section: any, si: number) => {
          const sectionScore = sectionScores?.[section.id.toString()];
          const belowThreshold =
            section.minimum_score !== null &&
            section.minimum_score > 0 &&
            sectionScore !== undefined &&
            sectionScore < section.minimum_score;

          return (
            <div key={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Section header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-2">
                    ส่วนที่ {si + 1}
                  </span>
                  <span className="font-semibold text-gray-800">{section.title}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">คะแนนส่วนนี้</p>
                  <p className={`text-lg font-bold ${belowThreshold ? "text-red-600" : "text-gray-900"}`}>
                    {sectionScore !== undefined ? sectionScore : "—"}
                    {belowThreshold && (
                      <span className="ml-1 text-xs font-normal text-red-400">
                        (ต่ำกว่าขั้นต่ำ {section.minimum_score})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Questions */}
              <div className="divide-y divide-gray-100">
                {section.questions.length === 0 && (
                  <p className="px-6 py-4 text-gray-400 text-sm">ไม่มีคำถามในส่วนนี้</p>
                )}
                {section.questions.map((q: any, qi: number) => {
                  const answer = answers?.[q.id.toString()];
                  const parsed = readableAnswer(q, answer);

                  return (
                    <div key={q.id} className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">
                          {qi + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-medium text-sm leading-snug">{q.text}</p>

                          <div className="mt-2">
                            {!parsed ? (
                              <span className="text-gray-300 text-sm italic">ไม่ได้ตอบ</span>
                            ) : parsed.type === "grid" ? (
                              <div className="rounded-lg border border-gray-200 overflow-hidden text-sm mt-1">
                                {parsed.rows.map((row: any, ri: number) => (
                                  <div
                                    key={ri}
                                    className={`flex items-center gap-3 px-4 py-2.5 ${ri % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                                  >
                                    <span className="text-gray-500 flex-1">{row.row}</span>
                                    <span className="font-medium text-gray-900">{row.col}</span>
                                  </div>
                                ))}
                              </div>
                            ) : parsed.type === "scale" ? (
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-400">{parsed.min}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full relative">
                                  <div
                                    className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full"
                                    style={{
                                      width: `${((parsed.value - parsed.min) / (parsed.max - parsed.min)) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">{parsed.max}</span>
                                <span className="text-sm font-bold text-blue-600 w-6 text-center">{parsed.value}</span>
                              </div>
                            ) : (
                              <span className="inline-block bg-blue-50 text-blue-800 text-sm px-3 py-1.5 rounded-lg">
                                {parsed.label || <span className="italic text-gray-400">ว่างเปล่า</span>}
                              </span>
                            )}
                          </div>

                          {parsed && (
                            <p className="mt-2 text-xs text-gray-400">
                              คะแนน: <span className="font-semibold text-gray-600">{parsed.score}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
