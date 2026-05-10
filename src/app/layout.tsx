import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบประเมิน ADL ผู้สูงอายุ",
  description: "ระบบวิจัยทางจิตวิทยาคลินิกสำหรับประเมินกิจวัตรประจำวันและภาวะซึมเศร้าในผู้สูงอายุ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-sarabun)]">{children}</body>
    </html>
  );
}
