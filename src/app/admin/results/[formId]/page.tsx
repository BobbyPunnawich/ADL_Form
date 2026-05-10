export const dynamic = "force-dynamic";

import { db } from "@/db";
import { forms, responses, sections } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ResultsPage({
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

  const responseList = await db
    .select()
    .from(responses)
    .where(eq(responses.formId, id))
    .orderBy(desc(responses.submittedAt));

  const completed = responseList.filter((r) => r.status === "completed").length;
  const terminated = responseList.filter((r) => r.status === "terminated").length;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700">
            ← กลับ
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ผลการตอบแบบสอบถาม</h1>
            <p className="text-gray-500 text-sm mt-0.5">{form.title}</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-4xl font-bold text-gray-900">{responseList.length}</p>
            <p className="text-gray-500 mt-1">ผู้ตอบทั้งหมด</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-4xl font-bold text-green-600">{completed}</p>
            <p className="text-gray-500 mt-1">ตอบครบทุกส่วน</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-4xl font-bold text-orange-500">{terminated}</p>
            <p className="text-gray-500 mt-1">หยุดก่อนกำหนด</p>
          </div>
        </div>

        {/* Results table */}
        {responseList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">ยังไม่มีผู้ตอบแบบสอบถาม</p>
            <Link
              href={`/play/${id}`}
              target="_blank"
              className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              เปิดแบบสอบถาม ↗
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-gray-600">#</th>
                    <th className="px-5 py-4 text-left font-semibold text-gray-600">Session</th>
                    {sectionList.map((s) => (
                      <th key={s.id} className="px-5 py-4 text-center font-semibold text-gray-600 whitespace-nowrap">
                        {s.title.replace("ส่วนที่ ", "ส่วน ")}
                      </th>
                    ))}
                    <th className="px-5 py-4 text-center font-semibold text-gray-600">รวม</th>
                    <th className="px-5 py-4 text-center font-semibold text-gray-600">สถานะ</th>
                    <th className="px-5 py-4 text-left font-semibold text-gray-600">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {responseList.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-gray-500">{idx + 1}</td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">
                        {r.sessionId.slice(-8)}
                      </td>
                      {sectionList.map((s) => {
                        const score = (r.sectionScores as Record<string, number>)[s.id.toString()];
                        const belowThreshold =
                          s.minimumScore !== null &&
                          s.minimumScore !== undefined &&
                          score !== undefined &&
                          score < s.minimumScore;
                        return (
                          <td key={s.id} className="px-5 py-4 text-center">
                            {score !== undefined ? (
                              <span
                                className={`font-semibold ${
                                  belowThreshold ? "text-red-600" : "text-gray-900"
                                }`}
                              >
                                {score}
                                {belowThreshold && (
                                  <span className="ml-1 text-xs text-red-400">(!)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-4 text-center font-bold text-gray-900">
                        {r.totalScore}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            r.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {r.status === "completed" ? "ครบ" : "หยุดก่อน"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
