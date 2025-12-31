import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

const getEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey };
};

export const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, anonKey } = getEnv();
  if (!url || !anonKey) {
    const message =
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
    if (process.env.NODE_ENV !== "production") {
      console.warn(message);
    }
    throw new Error(message);
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
};
