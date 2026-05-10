import { createClient } from "@supabase/supabase-js";

// Server-side only — uses service role key to bypass RLS.
// The custom fetch passes cache: 'no-store' so Next.js Data Cache never
// serves stale rows after admin edits.
export function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}
