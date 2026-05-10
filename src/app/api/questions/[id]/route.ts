import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDB();
  const body = await req.json();

  const { data, error } = await db
    .from("questions")
    .update({ text: body.text, text_en: body.text_en ?? null, type: body.type, options: body.options })
    .eq("id", parseInt(id))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDB();
  const { error } = await db.from("questions").delete().eq("id", parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
