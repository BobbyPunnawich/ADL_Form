import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Use individual params from env (direct Supabase host) — avoids pooler DNS issues
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: 5432,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

export const db = drizzle(pool, { schema });
