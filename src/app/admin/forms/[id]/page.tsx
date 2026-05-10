export const dynamic = "force-dynamic";

import { db } from "@/db";
import { forms, sections, questions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import SectionEditor from "./SectionEditor";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const formId = parseInt(id);

  const form = await db.query.forms.findFirst({ where: eq(forms.id, formId) });
  if (!form) notFound();

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
    questions: questionList.filter((q) => q.sectionId === s.id),
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← กลับ
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">ตั้งค่าแบบสอบถาม</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-blue-800 font-medium">
            🔗 ลิงก์สำหรับผู้ตอบแบบสอบถาม:
          </p>
          <code className="block mt-2 text-blue-700 bg-blue-100 rounded-lg px-4 py-2">
            /play/{formId}
          </code>
        </div>

        {sectionsWithQuestions.map((section) => (
          <SectionEditor key={section.id} section={section} />
        ))}
      </div>
    </main>
  );
}
