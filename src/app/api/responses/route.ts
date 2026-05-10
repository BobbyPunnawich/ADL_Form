import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { responses, forms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const formId = searchParams.get("formId");

  const query = db
    .select({
      id: responses.id,
      sessionId: responses.sessionId,
      sectionScores: responses.sectionScores,
      totalScore: responses.totalScore,
      status: responses.status,
      terminatedAtSection: responses.terminatedAtSection,
      submittedAt: responses.submittedAt,
      formTitle: forms.title,
    })
    .from(responses)
    .innerJoin(forms, eq(responses.formId, forms.id))
    .orderBy(desc(responses.submittedAt));

  if (formId) {
    const results = await query.where(eq(responses.formId, parseInt(formId)));
    return NextResponse.json(results);
  }

  const results = await query;
  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const body = await req.json();
  const [response] = await db
    .insert(responses)
    .values({
      formId: body.formId,
      sessionId: body.sessionId,
      answers: body.answers,
      sectionScores: body.sectionScores,
      totalScore: body.totalScore,
      status: body.status,
      terminatedAtSection: body.terminatedAtSection ?? null,
    })
    .returning();
  return NextResponse.json(response, { status: 201 });
}
