import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { forms } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const allForms = await db.select().from(forms).orderBy(desc(forms.createdAt));
  return NextResponse.json(allForms);
}

export async function POST(req: Request) {
  const body = await req.json();
  const [form] = await db
    .insert(forms)
    .values({ title: body.title, description: body.description })
    .returning();
  return NextResponse.json(form, { status: 201 });
}
