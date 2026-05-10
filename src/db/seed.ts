import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function makePool(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("pgbouncer");
  return new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 1,
  });
}

const pool = makePool(process.env.DATABASE_URL!);
const db = drizzle(pool, { schema });

const barthelQuestions: Array<{ text: string; options: Array<{ label: string; score: number }> }> = [
  {
    text: "1. การรับประทานอาหาร (Feeding)",
    options: [
      { label: "ไม่สามารถทำได้เลย / ต้องการความช่วยเหลือทั้งหมด", score: 0 },
      { label: "ต้องการความช่วยเหลือบางส่วน (เช่น ตัดอาหาร)", score: 1 },
      { label: "ทำได้ด้วยตนเองทั้งหมด", score: 2 },
    ],
  },
  {
    text: "2. การอาบน้ำ (Bathing)",
    options: [
      { label: "ต้องการความช่วยเหลือ", score: 0 },
      { label: "ทำได้ด้วยตนเอง", score: 1 },
    ],
  },
  {
    text: "3. การดูแลสุขอนามัยส่วนตัว (Grooming) เช่น ล้างหน้า หวีผม แปรงฟัน",
    options: [
      { label: "ต้องการความช่วยเหลือ", score: 0 },
      { label: "ทำได้ด้วยตนเอง", score: 1 },
    ],
  },
  {
    text: "4. การแต่งกาย (Dressing)",
    options: [
      { label: "ไม่สามารถทำได้เลย", score: 0 },
      { label: "ต้องการความช่วยเหลือบางส่วน", score: 1 },
      { label: "ทำได้ด้วยตนเองทั้งหมด", score: 2 },
    ],
  },
  {
    text: "5. การควบคุมการขับถ่ายอุจจาระ (Bowel Control)",
    options: [
      { label: "ควบคุมไม่ได้ / ต้องการการสวนอุจจาระ", score: 0 },
      { label: "ควบคุมได้บางครั้ง (อุบัติเหตุ ≤1 ครั้ง/สัปดาห์)", score: 1 },
      { label: "ควบคุมได้ปกติ", score: 2 },
    ],
  },
  {
    text: "6. การควบคุมการปัสสาวะ (Bladder Control)",
    options: [
      { label: "ควบคุมไม่ได้ / ใส่สายสวน", score: 0 },
      { label: "ควบคุมได้บางครั้ง (อุบัติเหตุ ≤1 ครั้ง/วัน)", score: 1 },
      { label: "ควบคุมได้ปกติ", score: 2 },
    ],
  },
  {
    text: "7. การใช้ห้องน้ำ (Toilet Use)",
    options: [
      { label: "ทำไม่ได้เลย", score: 0 },
      { label: "ต้องการความช่วยเหลือบางส่วน", score: 1 },
      { label: "ทำได้ด้วยตนเองทั้งหมด", score: 2 },
    ],
  },
  {
    text: "8. การเคลื่อนย้าย เช่น จากเตียงไปยังเก้าอี้ (Transfers: Bed to Chair)",
    options: [
      { label: "ทำไม่ได้เลย ไม่มีการทรงตัว", score: 0 },
      { label: "ต้องการความช่วยเหลือมาก (1-2 คน)", score: 1 },
      { label: "ต้องการความช่วยเหลือเล็กน้อย (verbal หรือ physical)", score: 2 },
      { label: "ทำได้ด้วยตนเอง", score: 3 },
    ],
  },
  {
    text: "9. การเดิน (Mobility/Walking) บนพื้นราบ",
    options: [
      { label: "เดินไม่ได้เลย", score: 0 },
      { label: "ใช้รถเข็น (wheelchair) ได้เองอย่างน้อย 50 เมตร", score: 1 },
      { label: "เดินได้ด้วยความช่วยเหลือ (คน/อุปกรณ์) อย่างน้อย 50 เมตร", score: 2 },
      { label: "เดินได้ด้วยตนเองอย่างน้อย 50 เมตร", score: 3 },
    ],
  },
  {
    text: "10. การขึ้น-ลงบันได (Stairs)",
    options: [
      { label: "ทำไม่ได้เลย", score: 0 },
      { label: "ต้องการความช่วยเหลือ", score: 1 },
      { label: "ทำได้ด้วยตนเอง", score: 2 },
    ],
  },
];

const depressionQuestions: Array<{ text: string }> = [
  { text: "1. รู้สึกหดหู่ เศร้า หรือท้อแท้สิ้นหวัง" },
  { text: "2. ไม่สนใจหรือไม่มีความสุขกับการทำสิ่งต่างๆ ที่เคยชอบทำ" },
  { text: "3. นอนหลับยาก หรือหลับมากเกินไป" },
  { text: "4. รู้สึกเหนื่อยล้า หรือไม่มีแรง" },
  { text: "5. รับประทานอาหารน้อยลง หรือมากขึ้น" },
  { text: "6. รู้สึกแย่กับตัวเอง รู้สึกว่าตัวเองล้มเหลว หรือทำให้ตัวเองหรือครอบครัวผิดหวัง" },
  { text: "7. มีความยากลำบากในการใจจดใจจ่อ เช่น อ่านหนังสือ หรือดูโทรทัศน์" },
  { text: "8. เคลื่อนไหวหรือพูดช้าลงจนคนอื่นสังเกตเห็น หรือกระสับกระส่าย อยู่ไม่นิ่ง" },
  { text: "9. คิดอยากทำร้ายตัวเอง หรือคิดว่าตายไปเสียดีกว่า" },
];

const depressionOptions = [
  { label: "ไม่มีเลย (0 วัน)", score: 0 },
  { label: "เป็นบางวัน (1-7 วัน)", score: 1 },
  { label: "เป็นบ่อย (8-14 วัน)", score: 2 },
  { label: "เป็นทุกวัน (15-21 วัน)", score: 3 },
];

async function seed() {
  console.log("Seeding database...");

  const [form] = await db
    .insert(schema.forms)
    .values({
      title: "แบบประเมินกิจวัตรประจำวันและภาวะซึมเศร้าในผู้สูงอายุ",
      description:
        "แบบประเมินสำหรับงานวิจัยทางจิตวิทยาคลินิก ประกอบด้วยการประเมินกิจวัตรประจำวัน (Barthel ADL) และการประเมินภาวะซึมเศร้า (9Q)",
      status: "active",
    })
    .returning();

  console.log("Created form:", form.id);

  // Part 1: Barthel ADL
  const [part1] = await db
    .insert(schema.sections)
    .values({
      formId: form.id,
      title: "ส่วนที่ 1: การประเมินกิจวัตรประจำวัน (Barthel ADL Index)",
      description:
        "โปรดตอบคำถามต่อไปนี้ตามความสามารถที่แท้จริงของท่านในปัจจุบัน",
      order: 1,
      minimumScore: 12,
      terminationMessage:
        "ขอบคุณสำหรับการตอบแบบสอบถาม จากผลการประเมิน ท่านได้คะแนนไม่ถึงเกณฑ์ที่กำหนด ทีมวิจัยขอขอบคุณท่านที่สละเวลาตอบแบบสอบถาม",
    })
    .returning();

  for (let i = 0; i < barthelQuestions.length; i++) {
    await db.insert(schema.questions).values({
      sectionId: part1.id,
      text: barthelQuestions[i].text,
      type: "multiple_choice",
      order: i + 1,
      options: barthelQuestions[i].options,
    });
  }
  console.log("Created Part 1 with", barthelQuestions.length, "questions");

  // Part 2: Demographics (placeholder — to be customized)
  const [part2] = await db
    .insert(schema.sections)
    .values({
      formId: form.id,
      title: "ส่วนที่ 2: ข้อมูลทั่วไป",
      description: "ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม",
      order: 2,
      minimumScore: null,
      terminationMessage: null,
    })
    .returning();

  await db.insert(schema.questions).values({
    sectionId: part2.id,
    text: "ระดับการศึกษาสูงสุดของท่านคือ",
    type: "multiple_choice",
    order: 1,
    options: [
      { label: "ประถมศึกษา", score: 0 },
      { label: "มัธยมศึกษา", score: 0 },
      { label: "อนุปริญญา / ปวส.", score: 0 },
      { label: "ปริญญาตรี", score: 0 },
      { label: "สูงกว่าปริญญาตรี", score: 0 },
    ],
  });

  console.log("Created Part 2");

  // Part 3: 9Q Depression
  const [part3] = await db
    .insert(schema.sections)
    .values({
      formId: form.id,
      title: "ส่วนที่ 3: การประเมินภาวะซึมเศร้า (9Q)",
      description:
        "ในช่วง 2-3 สัปดาห์ที่ผ่านมา ท่านมีอาการดังต่อไปนี้บ่อยแค่ไหน",
      order: 3,
      minimumScore: null,
      terminationMessage: null,
    })
    .returning();

  for (let i = 0; i < depressionQuestions.length; i++) {
    await db.insert(schema.questions).values({
      sectionId: part3.id,
      text: depressionQuestions[i].text,
      type: "multiple_choice",
      order: i + 1,
      options: depressionOptions,
    });
  }
  console.log("Created Part 3 with", depressionQuestions.length, "questions");

  console.log("Seeding complete. Form ID:", form.id);
}

seed().catch(console.error);
