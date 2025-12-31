"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "./supabaseClient";

export const useSupabaseSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = getSupabaseClient();
      supabase.auth
        .getSession()
        .then(({ data }) => setSession(data.session ?? null))
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Auth error."),
        );
      const { data } = supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          setSession(nextSession);
        },
      );
      subscription = data.subscription;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Supabase not configured.");
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { session, error };
};
