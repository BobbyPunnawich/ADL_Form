import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { sections, questions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.json();
  const [section] = await db
    .insert(sections)
    .values({
      formId: body.formId,
      title: body.title,
      description: body.description,
      order: body.order,
      minimumScore: body.minimumScore ?? null,
      terminationMessage: body.terminationMessage ?? null,
    })
    .returning();
  return NextResponse.json(section, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const [updated] = await db
    .update(sections)
    .set({
      title: body.title,
      description: body.description,
      minimumScore: body.minimumScore ?? null,
      terminationMessage: body.terminationMessage ?? null,
    })
    .where(eq(sections.id, body.id))
    .returning();
  return NextResponse.json(updated);
}
