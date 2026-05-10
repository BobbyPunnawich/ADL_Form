export const dynamic = "force-dynamic";

import { getDB } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import FormBuilder from "./FormBuilder";
import type { FormWithSections } from "@/types/db";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const formId = parseInt(id);
  const db = getDB();

  const { data: form, error } = await db
    .from("forms")
    .select("*")
    .eq("id", formId)
    .single();

  if (error || !form) notFound();

  const { data: sections } = await db
    .from("sections")
    .select("*, questions(*)")
    .eq("form_id", formId)
    .order("order");

  const sectionsWithSorted = (sections ?? []).map((s: any) => ({
    ...s,
    questions: [...(s.questions ?? [])].sort((a: any, b: any) => a.order - b.order),
  }));

  const fullForm: FormWithSections = { ...form, sections: sectionsWithSorted };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              ← กลับ
            </Link>
            <div className="h-5 w-px bg-gray-300" />
            <h1 className="text-lg font-bold text-gray-900 line-clamp-1">{form.title}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/results/${formId}`}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm"
            >
              ดูผล
            </Link>
            <Link
              href={`/play/${formId}`}
              target="_blank"
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 text-sm"
            >
              เปิดแบบสอบถาม ↗
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <FormBuilder form={fullForm} />
      </div>
    </main>
  );
}
