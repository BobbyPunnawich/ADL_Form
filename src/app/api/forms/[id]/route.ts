import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDB();

  const { data: form, error: formErr } = await db
    .from("forms")
    .select("*")
    .eq("id", parseInt(id))
    .single();
  if (formErr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: sections } = await db
    .from("sections")
    .select("*, questions(*)")
    .eq("form_id", parseInt(id))
    .order("order");

  const sectionsWithSortedQuestions = (sections ?? []).map((s: any) => ({
    ...s,
    questions: [...(s.questions ?? [])].sort((a: any, b: any) => a.order - b.order),
  }));

  return NextResponse.json({ ...form, sections: sectionsWithSortedQuestions });
}
