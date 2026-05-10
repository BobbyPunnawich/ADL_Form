import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = getDB();
  const body = await req.json();

  const { data: existing } = await db
    .from("questions")
    .select("order")
    .eq("section_id", body.section_id)
    .order("order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 1;

  const { data, error } = await db
    .from("questions")
    .insert({
      section_id: body.section_id,
      text: body.text ?? "คำถามใหม่",
      type: "multiple_choice",
      order: nextOrder,
      options: body.options ?? [{ label: "ตัวเลือกที่ 1", score: 0 }],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
