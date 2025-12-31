"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { validateProduct } from "@/lib/scoring";
import { canSaveNow, isPro } from "@/lib/billing";
import { addCloudItem, loadCloudLibrary } from "@/lib/cloudLibrary";
import {
  createSavedProduct,
  loadLibrary,
  saveToLibrary,
} from "@/lib/storage";
import type { SavedProduct } from "@/lib/storage";
import type { ValidationResult } from "@/lib/types";
import { useSupabaseSession } from "@/lib/useSession";
import Toast from "@/components/ui/Toast";
import UpgradeModal from "@/components/ui/UpgradeModal";

const decisionStyles: Record<
  ValidationResult["decision"],
  { label: string; className: string }
> = {
  green: {
    label: "Green",
    className: "bg-emerald-100 text-emerald-700",
  },
  yellow: {
    label: "Yellow",
    className: "bg-amber-100 text-amber-700",
  },
  red: {
    label: "Red",
    className: "bg-rose-100 text-rose-700",
  },
};

const scoreLabels: Array<{
  key: keyof ValidationResult["scores"];
  label: string;
}> = [
  { key: "demand", label: "Demand" },
  { key: "competition", label: "Competition" },
  { key: "margin", label: "Margin" },
  { key: "shipping", label: "Shipping Risk" },
  { key: "trend", label: "Trend" },
  { key: "brandability", label: "Brandability" },
];

export default function DashboardClient() {
  const [productText, setProductText] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [validatedText, setValidatedText] = useState<string | null>(null);
  const [library, setLibrary] = useState<SavedProduct[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showScoreHelp, setShowScoreHelp] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id ?? null;

  const normalizedText = productText.trim();
  const normalizedKey = normalizedText.toLowerCase();
  const loadId = searchParams.get("load");
  const scoreOutOf10 = result ? (result.scores.total / 10).toFixed(1) : null;
  const alreadySaved =
    normalizedKey.length > 0 &&
    library.some(
      (item) => item.productText.trim().toLowerCase() === normalizedKey,
    );
  const canSave = Boolean(result && normalizedKey.length > 0);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (userId) {
        try {
          const cloudItems = await loadCloudLibrary(userId);
          if (isActive) {
            setLibrary(cloudItems);
          }
        } catch {
          if (isActive) {
            setLibrary([]);
          }
        }
      } else {
        setLibrary(loadLibrary());
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasOnboarded = window.localStorage.getItem(
      "dropscout_onboarded_v1",
    );
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (!loadId) {
      setLoadMessage(null);
      return;
    }

    const loadSaved = async () => {
      try {
        const items = userId ? await loadCloudLibrary(userId) : loadLibrary();
        const saved = items.find((item) => item.id === loadId);
        if (!saved) {
          setLoadMessage(
            "We couldn't find that saved product. It may have been deleted.",
          );
          return;
        }

        setProductText(saved.productText);
        setResult(
          validateProduct({
            productText: saved.productText,
          }),
        );
        setValidatedText(saved.productText);
        setLoadMessage("Loaded saved validation from your library.");
      } catch {
        setLoadMessage(
          "We couldn't load that saved product. Please try again.",
        );
      }
    };

    loadSaved();
  }, [loadId, userId]);

  useEffect(() => {
    setSaveState("idle");
  }, [normalizedKey, result]);

  useEffect(() => {
    if (!result || validatedText === null) return;
    if (productText !== validatedText) {
      setResult(null);
      setValidatedText(null);
    }
  }, [productText, result, validatedText]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleValidate = () => {
    const validation = validateProduct({
      productText: normalizedText,
    });
    console.log("VALIDATION RESULT", validation);
    console.log("TOTAL SCORE", validation.scores.total);
    setResult(validation);
    setValidatedText(productText);
  };

  const handleSave = async () => {
    if (!result || !normalizedText) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (alreadySaved) {
      showToast("Already in Library");
      return;
    }

    if (!isPro()) {
      const gate = canSaveNow(library.length, 10);
      if (!gate.ok) {
        setUpgradeMessage(
          "Free accounts can save up to 10 products. Upgrade to Pro for unlimited saves.",
        );
        setShowUpgradeModal(true);
        return;
      }
    }

    const savedItem = createSavedProduct(normalizedText, result);
    if (userId) {
      try {
        await addCloudItem(userId, savedItem);
        const cloudItems = await loadCloudLibrary(userId);
        setLibrary(cloudItems);
        showToast("Saved to Library");
      } catch {
        showToast("Could not save right now. Try again.");
      }
    } else {
      const next = saveToLibrary(savedItem);
      setLibrary(next);
      showToast("Saved to Library");
    }

    setSaveState("saved");
    saveTimerRef.current = setTimeout(() => {
      setSaveState("idle");
    }, 1800);
  };

  const handleOnboarded = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dropscout_onboarded_v1", "true");
    }
    setShowOnboarding(false);
  };

  const handleExample = () => {
    const example = "Ergonomic travel pillow for long flights";
    setProductText(example);
    setResult(
      validateProduct({
        productText: example,
      }),
    );
    setValidatedText(example);
    handleOnboarded();
  };
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Product Validator
        </h1>
        <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
          DropScout gives dropshippers a fast, clear decision on what to sell,
          with the reasoning spelled out.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Product input
              </h2>
              <p className="text-sm text-slate-500">
                Paste a URL or describe the product idea you want to validate.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="product"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  Product URL or idea
                </label>
                <input
                  id="product"
                  placeholder="e.g. Portable espresso grinder for travel"
                  value={productText}
                  onChange={(event) => setProductText(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
                <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                  <p>
                    Tip: Be specific. “Travel pillow” is vague. “Ergonomic
                    travel pillow for long flights” works better.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowScoreHelp((prev) => !prev)}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                  >
                    What do these scores mean?
                  </button>
                  {showScoreHelp ? (
                    <div className="mt-2 space-y-2 text-xs text-slate-600">
                      <p>
                        <span className="font-semibold">Demand:</span> how
                        likely people are actively looking for it.
                      </p>
                      <p>
                        <span className="font-semibold">Competition:</span> how
                        crowded the market is.
                      </p>
                      <p>
                        <span className="font-semibold">Margin:</span> whether
                        pricing leaves room for profit after costs.
                      </p>
                      <p>
                        <span className="font-semibold">Shipping Risk:</span>{" "}
                        likelihood of returns, damage, or complex shipping.
                      </p>
                      <p>
                        <span className="font-semibold">Trend:</span> whether it
                        feels stable versus fad-driven.
                      </p>
                      <p>
                        <span className="font-semibold">Brandability:</span>{" "}
                        whether it can stand out and be positioned clearly.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={handleValidate}
                className="h-12 rounded-2xl bg-[var(--brand)] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)]"
              >
                Validate Product
              </button>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {result
                ? "Try another product to compare results."
                : "Results will appear here after validation."}
            </div>
            {loadMessage ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                {loadMessage}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Decision summary
            </h2>
            {result ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${decisionStyles[result.decision].className}`}
              >
                {decisionStyles[result.decision].label}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                Waiting
              </span>
            )}
          </div>

          {result ? (
            <div className="mt-6 space-y-6 text-sm">
              <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-slate-700">
                {result.summary}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Overall score
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  {scoreOutOf10 !== null ? `${scoreOutOf10}/10` : "—"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave || saveState === "saved"}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {alreadySaved || saveState === "saved"
                    ? "Saved"
                    : "Save to Library"}
                </button>
                {!normalizedText ? (
                  <span className="text-xs text-slate-500">
                    Add a product description to save.
                  </span>
                ) : alreadySaved ? (
                  <span className="text-xs text-slate-500">
                    This product is already in your library.
                  </span>
                ) : null}
              </div>

              <dl className="space-y-3">
                {scoreLabels.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)] px-4 py-3"
                  >
                    <dt className="text-slate-500">{item.label}</dt>
                    <dd className="font-semibold text-slate-900">
                      {result.scores[item.key]}/10
                    </dd>
                  </div>
                ))}
              </dl>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Reasons
                </p>
                <ul className="mt-3 space-y-2">
                  {result.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="rounded-2xl bg-white px-4 py-2 text-slate-600 shadow-sm"
                    >
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {result.warnings.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Warnings
                  </p>
                  <ul className="mt-3 space-y-2">
                    {result.warnings.map((warning) => (
                      <li
                        key={warning}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Run a validation to see the decision, scores, and key signals.
            </div>
          )}
        </section>
      </div>
      <details className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold uppercase tracking-[0.2em] text-slate-500">
          Debug
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <span className="font-semibold text-slate-700">Input string:</span>{" "}
            {productText || "—"}
          </div>
          <div>
            <span className="font-semibold text-slate-700">
              Displayed score:
            </span>{" "}
            {scoreOutOf10 !== null ? `${scoreOutOf10}/10` : "—"}
          </div>
          <pre className="whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600">
            {result ? JSON.stringify(result, null, 2) : "No result yet."}
          </pre>
        </div>
      </details>
      {toastMessage ? <Toast message={toastMessage} /> : null}
      <UpgradeModal
        open={showUpgradeModal}
        title="Save more products"
        description={
          upgradeMessage ??
          "Upgrade to Pro to save unlimited products in your library."
        }
        onClose={() => setShowUpgradeModal(false)}
      />
      {showOnboarding ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={handleOnboarded}
              aria-label="Close onboarding"
              className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
            >
              ✕
            </button>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Welcome
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Validate before you build.
              </h2>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Paste a product idea or link</li>
                <li>• Get a clear Green / Yellow / Red decision</li>
                <li>• Avoid costly product mistakes</li>
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleExample}
                  className="rounded-2xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)]"
                >
                  Try an example
                </button>
                <button
                  type="button"
                  onClick={handleOnboarded}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Start from scratch
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
