export const dynamic = "force-dynamic";

import { getDB } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminPage() {
  const db = getDB();

  const { data: allForms } = await db
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: responseCounts } = await db
    .from("responses")
    .select("form_id");

  const countMap: Record<number, number> = {};
  for (const r of responseCounts ?? []) {
    countMap[r.form_id] = (countMap[r.form_id] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แผงควบคุมผู้ดูแล</h1>
          <p className="text-gray-500 mt-1">จัดการแบบสอบถามและดูผลการตอบ</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">แบบสอบถามทั้งหมด</h2>
        </div>

        {!allForms || allForms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">
              ยังไม่มีแบบสอบถาม กรุณา seed ฐานข้อมูลก่อน
            </p>
            <code className="block mt-4 bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
              npm run db:seed
            </code>
          </div>
        ) : (
          <div className="space-y-4">
            {allForms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        form.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {form.status === "active" ? "เปิดใช้งาน" : form.status}
                    </span>
                  </div>
                  {form.description && (
                    <p className="text-gray-500 text-sm line-clamp-1">{form.description}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">
                    ผู้ตอบ: {countMap[form.id] ?? 0} คน
                  </p>
                </div>
                <div className="flex gap-3 ml-4 flex-shrink-0">
                  <Link
                    href={`/admin/forms/${form.id}`}
                    className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    ✏️ แก้ไข
                  </Link>
                  <Link
                    href={`/admin/results/${form.id}`}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm"
                  >
                    ดูผล
                  </Link>
                  <Link
                    href={`/play/${form.id}`}
                    target="_blank"
                    className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors text-sm"
                  >
                    เปิดแบบสอบถาม ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
