import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDB();
  const body = await req.json();

  // Attempt save with text_en. If the column doesn't exist yet (pg code 42703),
  // fall back to saving without it so the core data is never lost.
  let { data, error } = await db
    .from("questions")
    .update({ text: body.text, text_en: body.text_en ?? null, type: body.type, options: body.options })
    .eq("id", parseInt(id))
    .select()
    .single();

  if (error && (error.code === "42703" || error.message?.includes("text_en"))) {
    ({ data, error } = await db
      .from("questions")
      .update({ text: body.text, type: body.type, options: body.options })
      .eq("id", parseInt(id))
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Revalidate the player page so changes appear immediately.
  const { data: section } = await db
    .from("sections")
    .select("form_id")
    .eq("id", data.section_id)
    .single();

  if (section) revalidatePath(`/play/${section.form_id}`);
  revalidatePath("/play", "layout");

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDB();

  const { data: q } = await db
    .from("questions")
    .select("section_id")
    .eq("id", parseInt(id))
    .single();

  const { error } = await db.from("questions").delete().eq("id", parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (q) {
    const { data: section } = await db
      .from("sections")
      .select("form_id")
      .eq("id", q.section_id)
      .single();
    if (section) revalidatePath(`/play/${section.form_id}`);
  }
  revalidatePath("/play", "layout");

  return NextResponse.json({ ok: true });
}
