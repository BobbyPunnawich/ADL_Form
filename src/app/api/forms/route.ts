import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDB();
  const { data, error } = await db
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const db = getDB();
  const body = await req.json();
  const { data, error } = await db
    .from("forms")
    .insert({ title: body.title, description: body.description ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
