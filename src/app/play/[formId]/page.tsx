export const dynamic = "force-dynamic";

import { getDB } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PlayerClient from "./PlayerClient";
import type { FormWithSections } from "@/types/db";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const id = parseInt(formId);
  const db = getDB();

  const { data: form, error } = await db.from("forms").select("*").eq("id", id).single();
  if (error || !form) notFound();

  const { data: sections } = await db
    .from("sections")
    .select("*, questions(*)")
    .eq("form_id", id)
    .order("order");

  const sectionsWithSorted = (sections ?? []).map((s: any) => ({
    ...s,
    questions: [...(s.questions ?? [])].sort((a: any, b: any) => a.order - b.order),
  }));

  const fullForm: FormWithSections = { ...form, sections: sectionsWithSorted };

  return <PlayerClient form={fullForm} />;
}
