import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

// drizzle-kit uses DIRECT_URL (session-mode pooler, port 5432) for DDL
const migrateUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: migrateUrl },
} satisfies Config;
