import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          ระบบประเมิน ADL ผู้สูงอายุ
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          ระบบวิจัยทางจิตวิทยาคลินิก สำหรับประเมินกิจวัตรประจำวันและภาวะซึมเศร้า
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/admin"
            className="px-8 py-4 bg-blue-600 text-white text-xl font-semibold rounded-2xl hover:bg-blue-700 transition-colors shadow-md"
          >
            แผงผู้ดูแล (Admin)
          </Link>
        </div>
      </div>
    </main>
  );
}
