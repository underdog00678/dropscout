"use client";

import Link from "next/link";
import { useState } from "react";

import { getSupabaseClient } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/lib/useSession";

export default function PricingPage() {
  const { session } = useSupabaseSession();
  const user = session?.user ?? null;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "duplicate" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user?.email || !user?.id) {
      setCheckoutError("Sign in to upgrade to Pro.");
      return;
    }
    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, userId: user.id }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setCheckoutError(data.error ?? "Unable to start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Unable to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    setErrorMessage(null);

    if (!trimmed) {
      setErrorMessage("Enter an email address to join the waitlist.");
      return;
    }

    setStatus("loading");
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("dropscout_waitlist")
        .insert({ email: trimmed });
      if (error) {
        if (error.code === "23505") {
          setStatus("duplicate");
          return;
        }
        setStatus("error");
        setErrorMessage("Something went wrong, try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong, try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-12 text-[color:var(--foreground)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
            Stop testing bad products.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            DropScout helps you avoid costly product mistakes with clear
            Green/Yellow/Red decisions.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Free
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">Starter</h2>
              <p className="text-sm text-slate-600">
                Validate ideas quickly with lightweight limits.
              </p>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li>Unlimited validations</li>
              <li>Save up to 10 products</li>
              <li>10 listing generations/week</li>
              <li>Plain export</li>
            </ul>
            <Link
              href="/app"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Get started
            </Link>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Pro
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">$15/mo</h2>
              <p className="text-sm text-slate-600">
                Everything you need to move faster.
              </p>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li>Unlimited saves</li>
              <li>Unlimited generations</li>
              <li>Shopify + Amazon exports</li>
              <li>Positioning export toggle</li>
              <li>Compare products</li>
            </ul>
            {user ? (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {checkoutLoading ? "Starting checkout..." : "Upgrade to Pro"}
              </button>
            ) : (
              <Link
                href="/auth/sign-in?next=/pricing"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300"
              >
                Sign in to upgrade
              </Link>
            )}
            {checkoutError ? (
              <p className="mt-3 text-sm text-rose-700">{checkoutError}</p>
            ) : null}
          </section>
        </div>

        <section
          id="waitlist"
          className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Join the Pro waitlist
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Be first in line for Pro.
            </h2>
            <p className="text-sm text-slate-600">
              We will email you when Pro launches with full access to unlimited
              saves and exports.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage(null);
                  if (status !== "idle") {
                    setStatus("idle");
                  }
                }}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                required
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--brand)] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading"
                  ? "Submitting..."
                  : "Notify me when Pro launches"}
              </button>
            </div>
            {status === "success" ? (
              <p className="text-sm text-emerald-700">You’re on the list.</p>
            ) : null}
            {status === "duplicate" ? (
              <p className="text-sm text-slate-600">
                You’re already on the list.
              </p>
            ) : null}
            {errorMessage ? (
              <p className="text-sm text-rose-700">{errorMessage}</p>
            ) : null}
          </form>
        </section>

        <p className="text-center text-sm text-slate-500">
          Payments coming soon. Pro is a preview right now.
        </p>
      </div>
    </div>
  );
}
