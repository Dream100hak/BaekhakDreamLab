/**
 * Supabase 서버 클라이언트
 * API Routes, Server Components에서 사용
 */

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_DEFAULT_KEY) are required."
    );
  }

  return createClient<Database>(supabaseUrl, key);
};
