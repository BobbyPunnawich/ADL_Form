import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const formId = searchParams.get("formId");
  const db = getDB();

  let query = db
    .from("responses")
    .select("*, forms(title)")
    .order("submitted_at", { ascending: false });

  if (formId) query = query.eq("form_id", parseInt(formId));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const db = getDB();
  const body = await req.json();
  const { data, error } = await db
    .from("responses")
    .insert({
      form_id: body.formId,
      session_id: body.sessionId,
      answers: body.answers,
      section_scores: body.sectionScores,
      total_score: body.totalScore,
      status: body.status,
      terminated_at_section: body.terminatedAtSection ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
