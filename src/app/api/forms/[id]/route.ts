import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDB();
  const body = await req.json();

  // Try with closing_message; fall back if column doesn't exist yet (pg 42703)
  let { data, error } = await db
    .from("forms")
    .update({
      title: body.title,
      description: body.description ?? null,
      closing_message: body.closing_message ?? null,
    })
    .eq("id", parseInt(id))
    .select()
    .single();

  if (error && (error.code === "42703" || error.message?.includes("closing_message"))) {
    ({ data, error } = await db
      .from("forms")
      .update({ title: body.title, description: body.description ?? null })
      .eq("id", parseInt(id))
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/play/${id}`);
  revalidatePath("/play", "layout");
  return NextResponse.json(data);
}
