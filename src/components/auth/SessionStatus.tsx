"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SessionStatus() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const supabase = getSupabaseClient();
      supabase.auth
        .getSession()
        .then(({ data }) => setSession(data.session ?? null))
        .catch(() => setHasError(true));

      const { data } = supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          setSession(nextSession);
        },
      );
      subscription = data.subscription;
    } catch {
      setHasError(true);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore if Supabase is not configured.
    } finally {
      router.push("/app");
      router.refresh();
    }
  };

  if (hasError) {
    return (
      <Link
        href="/auth/sign-in"
        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300"
      >
        Sign in
      </Link>
    );
  }

  if (session?.user) {
    return (
      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Signed in
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {session.user.email ?? "Signed in"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Not signed in
      </p>
      <Link
        href="/auth/sign-in"
        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300"
      >
        Sign in
      </Link>
    </div>
  );
}
