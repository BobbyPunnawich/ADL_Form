import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = getDB();
  const body = await req.json();

  const { data: existing } = await db
    .from("sections")
    .select("order")
    .eq("form_id", body.form_id)
    .order("order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 1;

  const { data, error } = await db
    .from("sections")
    .insert({
      form_id: body.form_id,
      title: body.title,
      description: body.description ?? null,
      order: nextOrder,
      minimum_score: body.minimum_score ?? null,
      termination_message: body.termination_message ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/play/${body.form_id}`);
  revalidatePath("/play", "layout");
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: Request) {
  const db = getDB();
  const body = await req.json();

  const { data, error } = await db
    .from("sections")
    .update({
      title: body.title,
      description: body.description ?? null,
      minimum_score: body.minimum_score ?? null,
      termination_message: body.termination_message ?? null,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/play/${data.form_id}`);
  revalidatePath("/play", "layout");
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const db = getDB();
  const { updates, form_id } = await req.json(); // [{ id, order }]
  await Promise.all(
    (updates as { id: number; order: number }[]).map(({ id, order }) =>
      db.from("sections").update({ order }).eq("id", id)
    )
  );
  if (form_id) revalidatePath(`/play/${form_id}`);
  revalidatePath("/play", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const db = getDB();
  const { id } = await req.json();

  const { data: section } = await db
    .from("sections")
    .select("form_id")
    .eq("id", id)
    .single();

  const { error } = await db.from("sections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (section) revalidatePath(`/play/${section.form_id}`);
  revalidatePath("/play", "layout");
  return NextResponse.json({ ok: true });
}
