import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { forms, sections, questions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formId = parseInt(id);

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
  });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sectionList = await db
    .select()
    .from(sections)
    .where(eq(sections.formId, formId))
    .orderBy(asc(sections.order));

  const questionList = await db
    .select()
    .from(questions)
    .orderBy(asc(questions.sectionId), asc(questions.order));

  const sectionsWithQuestions = sectionList.map((s) => ({
    ...s,
    questions: questionList
      .filter((q) => q.sectionId === s.id)
      .sort((a, b) => a.order - b.order),
  }));

  return NextResponse.json({ ...form, sections: sectionsWithQuestions });
}
