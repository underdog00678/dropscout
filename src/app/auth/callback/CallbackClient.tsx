"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient();

      // Let Supabase finalize session from the URL if present.
      // (Works for magic link / OAuth style redirects)
      await supabase.auth.getSession();

      const next = searchParams.get("next") || "/app";
      router.replace(next);
      router.refresh();
    };

    run().catch(() => {
      router.replace("/auth/sign-in?next=/app");
      router.refresh();
    });
  }, [router, searchParams]);

  return <div className="p-6">Signing you in…</div>;
}