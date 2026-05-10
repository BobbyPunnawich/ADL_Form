import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDB } from "@/lib/supabase";
import type { AnswerValue, ChoiceOptions, GridOptions, TextOptions, ScaleOptions } from "@/types/db";

export const dynamic = "force-dynamic";

// ─── helpers ─────────────────────────────────────────────────────────────────

function readableAnswer(question: any, answer: AnswerValue | undefined): string {
  if (!answer) return "";
  const opts = question.options;

  switch (question.type) {
    case "multiple_choice":
    case "radio":
    case "dropdown": {
      if (answer.optionIndex === undefined) return "";
      return (opts as ChoiceOptions)[answer.optionIndex]?.label ?? "";
    }
    case "checkbox": {
      const choices = opts as ChoiceOptions;
      return (answer.selectedIndices ?? [])
        .map((i: number) => choices[i]?.label ?? "")
        .filter(Boolean)
        .join(", ");
    }
    case "short_answer":
    case "long_answer":
      return answer.text ?? "";
    case "linear_scale":
      return answer.scaleValue !== undefined ? String(answer.scaleValue) : "";
    case "radio_grid": {
      const grid = opts as GridOptions;
      return grid.rows
        .map((row: string, ri: number) => {
          const ci = answer.rowSelections?.[ri.toString()];
          const col = ci !== undefined ? (grid.columns[ci]?.label ?? "") : "—";
          return `${row}: ${col}`;
        })
        .join(" | ");
    }
    case "checkbox_grid": {
      const grid = opts as GridOptions;
      return grid.rows
        .map((row: string, ri: number) => {
          const cis = answer.rowMultiSelections?.[ri.toString()] ?? [];
          const cols = cis.map((ci: number) => grid.columns[ci]?.label ?? "").filter(Boolean);
          return `${row}: ${cols.length ? cols.join(", ") : "—"}`;
        })
        .join(" | ");
    }
    default:
      return "";
  }
}

function thaiDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── GET /api/responses/export?formId=N ──────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const formId = searchParams.get("formId");
  if (!formId) return NextResponse.json({ error: "formId required" }, { status: 400 });

  const db = getDB();
  const id = parseInt(formId);

  // Fetch form
  const { data: form } = await db.from("forms").select("*").eq("id", id).single();

  // Fetch sections + questions (ordered)
  const { data: sections } = await db
    .from("sections")
    .select("*, questions(*)")
    .eq("form_id", id)
    .order("order");

  const sortedSections = (sections ?? []).map((s: any) => ({
    ...s,
    questions: [...(s.questions ?? [])].sort((a: any, b: any) => a.order - b.order),
  }));

  const allQuestions = sortedSections.flatMap((s: any) =>
    s.questions.map((q: any, qi: number) => ({
      ...q,
      sectionTitle: s.title,
      sectionOrder: s.order,
      localNumber: qi + 1,
    }))
  );

  // Fetch all responses
  const { data: responses } = await db
    .from("responses")
    .select("*")
    .eq("form_id", id)
    .order("submitted_at", { ascending: true });

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary (scores per section) ──────────────────────────────────

  const summaryHeader = [
    "#",
    "Session ID",
    "วันที่และเวลา / Date & Time",
    "สถานะ / Status",
    ...sortedSections.map((s: any, i: number) => `ส่วนที่ ${i + 1}: ${s.title} (คะแนน)`),
    "คะแนนรวม / Total Score",
  ];

  const summaryRows = (responses ?? []).map((r: any, idx: number) => {
    const scores = r.section_scores as Record<string, number>;
    return [
      idx + 1,
      r.session_id,
      thaiDate(r.submitted_at),
      r.status === "completed" ? "ครบทุกส่วน" : "หยุดก่อนกำหนด",
      ...sortedSections.map((s: any) => scores?.[s.id.toString()] ?? ""),
      r.total_score,
    ];
  });

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryRows]);
  wsSummary["!cols"] = summaryHeader.map((h) => ({ wch: Math.max(String(h).length, 14) }));
  XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปคะแนน");

  // ── Sheet 2: All answers (one column per question) ─────────────────────────

  let questionNum = 0;
  const answerHeader = [
    "#",
    "Session ID",
    "วันที่และเวลา / Date & Time",
    "สถานะ / Status",
    "คะแนนรวม / Total Score",
    ...allQuestions.map((q: any) => {
      questionNum++;
      return `Q${questionNum} [${q.sectionTitle}]\n${q.text}`;
    }),
  ];

  const answerRows = (responses ?? []).map((r: any, idx: number) => {
    const answers = r.answers as Record<string, AnswerValue>;
    return [
      idx + 1,
      r.session_id,
      thaiDate(r.submitted_at),
      r.status === "completed" ? "ครบทุกส่วน" : "หยุดก่อนกำหนด",
      r.total_score,
      ...allQuestions.map((q: any) => readableAnswer(q, answers?.[q.id.toString()])),
    ];
  });

  const wsAnswers = XLSX.utils.aoa_to_sheet([answerHeader, ...answerRows]);

  // Set column widths: meta columns narrow, question columns wider
  wsAnswers["!cols"] = answerHeader.map((_, ci) => ({
    wch: ci < 5 ? 18 : 30,
  }));

  // Wrap text in header row
  const range = XLSX.utils.decode_range(wsAnswers["!ref"] ?? "A1");
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = wsAnswers[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) cell.s = { alignment: { wrapText: true } };
  }

  XLSX.utils.book_append_sheet(wb, wsAnswers, "คำตอบทั้งหมด");

  // ── Sheet 3: Per-section breakdown ────────────────────────────────────────

  for (const section of sortedSections) {
    if (!section.questions.length) continue;

    const secHeader = [
      "#",
      "Session ID",
      "วันที่และเวลา",
      "สถานะ",
      `คะแนนส่วนนี้`,
      ...section.questions.map((q: any, qi: number) => `Q${qi + 1}: ${q.text}`),
    ];

    const secRows = (responses ?? []).map((r: any, idx: number) => {
      const scores = r.section_scores as Record<string, number>;
      const answers = r.answers as Record<string, AnswerValue>;
      return [
        idx + 1,
        r.session_id,
        thaiDate(r.submitted_at),
        r.status === "completed" ? "ครบ" : "หยุด",
        scores?.[section.id.toString()] ?? "",
        ...section.questions.map((q: any) => readableAnswer(q, answers?.[q.id.toString()])),
      ];
    });

    const wsSection = XLSX.utils.aoa_to_sheet([secHeader, ...secRows]);
    wsSection["!cols"] = secHeader.map((_, ci) => ({ wch: ci < 5 ? 16 : 28 }));

    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = section.title.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, wsSection, sheetName);
  }

  // ── Write and return ───────────────────────────────────────────────────────

  const buf: Uint8Array = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date = new Date().toISOString().slice(0, 10);
  const safeName = (form?.title ?? "form").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
  const filename = `${safeName}_responses_${date}.xlsx`;

  return new NextResponse(buf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
