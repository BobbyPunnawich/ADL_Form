export const dynamic = "force-dynamic";

import { db } from "@/db";
import { forms, sections, questions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import PlayerClient from "./PlayerClient";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const id = parseInt(formId);

  const form = await db.query.forms.findFirst({ where: eq(forms.id, id) });
  if (!form) notFound();

  const sectionList = await db
    .select()
    .from(sections)
    .where(eq(sections.formId, id))
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

  return (
    <PlayerClient
      form={{ ...form, sections: sectionsWithQuestions }}
    />
  );
}
