"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const code = searchParams.get("code");
  const nextPath =
    nextParam && nextParam.startsWith("/") ? nextParam : "/app";

  useEffect(() => {
    const supabase = getSupabaseClient();
    const finalize = async () => {
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // Ignore and fall back to getSession.
        }
      }
      await supabase.auth.getSession();
      router.replace(nextPath);
      router.refresh();
    };

    finalize();
  }, [code, nextPath, router, searchParams]);

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-12 text-[color:var(--foreground)]">
      <div className="mx-auto flex w-full max-w-md items-center justify-center rounded-3xl bg-white p-8 text-sm text-slate-600 shadow-sm ring-1 ring-black/5">
        Signing you in…
      </div>
    </div>
  );
}
