"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  addCloudItem,
  deleteCloudItem,
  loadCloudLibrary,
} from "@/lib/cloudLibrary";
import { getPlan } from "@/lib/billing";
import { clearLibrary, loadLibrary, removeFromLibrary } from "@/lib/storage";
import type { SavedProduct } from "@/lib/storage";
import type { ValidationResult } from "@/lib/types";
import { useSupabaseSession } from "@/lib/useSession";
import Toast from "@/components/ui/Toast";

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

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function LibraryPage() {
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [localItems, setLocalItems] = useState<SavedProduct[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<"local" | "cloud">("local");
  const [importConfirm, setImportConfirm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { session } = useSupabaseSession();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    setLocalItems(loadLibrary());
  }, [userId]);

  useEffect(() => {
    setPlan(getPlan());
  }, []);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (userId) {
        setStorageMode("cloud");
        try {
          const cloudItems = await loadCloudLibrary(userId);
          if (isActive) {
            setItems(cloudItems);
          }
        } catch {
          if (isActive) {
            setItems([]);
            setImportError("Unable to load cloud library right now.");
          }
        }
      } else {
        setStorageMode("local");
        setItems(loadLibrary());
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const selectedItems = useMemo(
    () => selectedIds.map((id) => items.find((item) => item.id === id)),
    [items, selectedIds],
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleDelete = async (id: string) => {
    let removed = false;
    if (userId) {
      try {
        await deleteCloudItem(userId, id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        removed = true;
      } catch {
        setToastMessage("Could not remove the item. Try again.");
      }
    } else {
      const next = removeFromLibrary(id);
      setItems(next);
      setLocalItems(next);
      removed = true;
    }

    setSelectedIds((prev) => prev.filter((item) => item !== id));
    if (expandedId === id) {
      setExpandedId(null);
    }
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    if (removed) {
      setToastMessage("Removed from Library");
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleToggleView = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const saveLimit = 10;
  const remainingSaves = Math.max(0, saveLimit - items.length);

  const handleImport = async (clearLocalAfter: boolean) => {
    if (!userId) return;
    setImporting(true);
    setImportError(null);
    const local = loadLibrary();

    try {
      for (const item of local) {
        await addCloudItem(userId, item);
      }
      const cloudItems = await loadCloudLibrary(userId);
      setItems(cloudItems);
      if (clearLocalAfter) {
        clearLibrary();
        setLocalItems([]);
      }
      setImportConfirm(false);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToastMessage("Imported local library to cloud.");
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
    } catch {
      setImportError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Library
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Saved validations
        </h1>
        <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
          Review past validations, compare decisions, and keep a record of what
          you have already evaluated.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Storage: {storageMode === "cloud" ? "Cloud" : "Local"}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Plan: {plan === "pro" ? "Pro" : "Free"}
          </div>
          {plan === "free" ? (
            <div className="text-xs text-slate-500">
              {remainingSaves} of {saveLimit} saves remaining.
            </div>
          ) : null}
        </div>
      </header>

      {userId && items.length === 0 && localItems.length > 0 ? (
        <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Import local library
              </h2>
              <p className="text-sm text-slate-500">
                You have {localItems.length} saved items locally. Bring them
                into your cloud library.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setImportConfirm(true)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
            >
              Import local library
            </button>
          </div>
          {importConfirm ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <p>
                Import local items to the cloud? You can keep the local copy or
                clear it afterward.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => handleImport(false)}
                  className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-60"
                >
                  Import only
                </button>
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => handleImport(true)}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-300 disabled:opacity-60"
                >
                  Import + clear local
                </button>
                <button
                  type="button"
                  onClick={() => setImportConfirm(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {importError ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {importError}
            </div>
          ) : null}
        </section>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-sm text-slate-500">
          No saved products yet. Validate a product and save it to build your
          library.
        </div>
      ) : (
        <div className="space-y-8">
          {selectedIds.length === 2 ? (
            <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Compare
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Side-by-side decision view
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                >
                  Clear compare
                </button>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {selectedItems
                  .filter(
                    (item): item is SavedProduct =>
                      typeof item !== "undefined",
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            {item.productText}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Saved {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${decisionStyles[item.result.decision].className}`}
                        >
                          {decisionStyles[item.result.decision].label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {item.result.summary}
                      </p>
                      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                        {scoreLabels.map((score) => (
                          <div
                            key={score.key}
                            className="flex items-center justify-between rounded-xl bg-[var(--surface-muted)] px-3 py-2"
                          >
                            <dt className="text-slate-500">{score.label}</dt>
                            <dd className="font-semibold text-slate-900">
                              {item.result.scores[score.key]}/10
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-4 space-y-3 text-xs text-slate-600">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Top reasons
                          </p>
                          <ul className="mt-2 space-y-1">
                            {item.result.reasons.slice(0, 3).map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Warnings
                          </p>
                          {item.result.warnings.length > 0 ? (
                            <ul className="mt-2 space-y-1 text-amber-700">
                              {item.result.warnings.slice(0, 2).map((warning) => (
                                <li key={warning}>{warning}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-slate-500">No warnings.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Select up to two products to compare decisions side by side.
            </div>
          )}

          <div className="space-y-6">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isExpanded = expandedId === item.id;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        disabled={!isSelected && selectedIds.length >= 2}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-emerald-200"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.productText}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Saved {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </label>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${decisionStyles[item.result.decision].className}`}
                    >
                      {decisionStyles[item.result.decision].label}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-slate-600">
                    {item.result.summary}
                  </p>

                  <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                    {scoreLabels.map((score) => (
                      <div
                        key={score.key}
                        className="flex items-center justify-between rounded-xl bg-[var(--surface-muted)] px-3 py-2"
                      >
                        <dt className="text-slate-500">{score.label}</dt>
                        <dd className="font-semibold text-slate-900">
                          {item.result.scores[score.key]}/10
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/app?load=${item.id}`}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
                    >
                      Open in Dashboard
                    </Link>
                    <Link
                      href={`/app/generate?load=${item.id}`}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
                    >
                      Send to Generate
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleView(item.id)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
                    >
                      {isExpanded ? "Hide details" : "View details"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-300"
                    >
                      Delete
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="mt-5 grid gap-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Reasons
                        </p>
                        <ul className="mt-3 space-y-2">
                          {item.result.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Warnings
                        </p>
                        {item.result.warnings.length > 0 ? (
                          <ul className="mt-3 space-y-2 text-amber-700">
                            {item.result.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-slate-500">
                            No warnings were flagged.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      )}
      {toastMessage ? <Toast message={toastMessage} /> : null}
    </div>
  );
}
