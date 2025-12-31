"use client";

import { useEffect, useRef, useState } from "react";

import {
  getPlan,
  getWeeklyGenerateCount,
  setPlan,
} from "@/lib/billing";
import { clearLibrary, loadLibrary } from "@/lib/storage";

type ExportFormat = "plain" | "shopify" | "amazon";

type AppSettings = {
  defaultExportFormat: ExportFormat;
  includePositioningByDefault: boolean;
};

const SETTINGS_KEY = "dropscout_settings_v1";

const defaultSettings: AppSettings = {
  defaultExportFormat: "plain",
  includePositioningByDefault: false,
};

const isBrowser = () => typeof window !== "undefined";

const isExportFormat = (value: unknown): value is ExportFormat =>
  value === "plain" || value === "shopify" || value === "amazon";

const sanitizeSettings = (value: unknown): AppSettings => {
  if (typeof value !== "object" || value === null) {
    return defaultSettings;
  }
  const record = value as Record<string, unknown>;
  return {
    defaultExportFormat: isExportFormat(record.defaultExportFormat)
      ? record.defaultExportFormat
      : defaultSettings.defaultExportFormat,
    includePositioningByDefault:
      typeof record.includePositioningByDefault === "boolean"
        ? record.includePositioningByDefault
        : defaultSettings.includePositioningByDefault,
  };
};

const loadSettings = () => {
  if (!isBrowser()) return defaultSettings;
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
};

const saveSettings = (settings: AppSettings) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [libraryCount, setLibraryCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [plan, setPlanState] = useState<"free" | "pro">("free");
  const [weeklyGenerations, setWeeklyGenerations] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setLibraryCount(loadLibrary().length);
    setPlanState(getPlan());
    setWeeklyGenerations(getWeeklyGenerateCount());
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const triggerSaved = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setSaveStatus("saved");
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("idle");
    }, 1200);
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      triggerSaved();
      return next;
    });
  };

  const handleClearLibrary = () => {
    clearLibrary();
    setLibraryCount(0);
    setConfirmClear(false);
  };

  const handleResetSettings = () => {
    if (isBrowser()) {
      window.localStorage.removeItem(SETTINGS_KEY);
    }
    setSettings(defaultSettings);
    triggerSaved();
  };

  const handlePlanSwitch = (nextPlan: "free" | "pro") => {
    setPlan(nextPlan);
    setPlanState(nextPlan);
  };

  const generateLimit = 10;
  const remainingGenerations = Math.max(
    0,
    generateLimit - weeklyGenerations,
  );

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Settings
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Settings
        </h1>
        <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
          Customize exports and manage your local data.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Export defaults
            </h2>
            <p className="text-sm text-slate-500">
              Apply a consistent export format for new generations.
            </p>
          </div>
          {saveStatus === "saved" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Saved
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <label
              htmlFor="export-format"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Default export format
            </label>
            <select
              id="export-format"
              value={settings.defaultExportFormat}
              onChange={(event) =>
                updateSettings({
                  defaultExportFormat: event.target.value as ExportFormat,
                })
              }
              className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="plain">Plain</option>
              <option value="shopify">Shopify</option>
              <option value="amazon">Amazon</option>
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Positioning content
            </p>
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.includePositioningByDefault}
                onChange={(event) =>
                  updateSettings({
                    includePositioningByDefault: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-emerald-200"
              />
              Include positioning in exports by default
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Plan</h2>
            <p className="text-sm text-slate-500">
              Toggle between Free and Pro preview mode.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            {plan === "pro" ? "Pro" : "Free"}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Usage this week
            </p>
            {plan === "pro" ? (
              <p className="mt-2 text-sm text-slate-700">
                Unlimited generations.
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-700">
                {weeklyGenerations} of {generateLimit} used · {remainingGenerations}{" "}
                remaining.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Plan controls
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handlePlanSwitch("pro")}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:border-emerald-300"
              >
                Switch to Pro (Preview)
              </button>
              <button
                type="button"
                onClick={() => handlePlanSwitch("free")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
              >
                Switch to Free
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Data</h2>
          <p className="text-sm text-slate-500">
            Manage what is stored locally in your browser.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Library
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Saved items: <span className="font-semibold">{libraryCount}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-300"
            >
              Clear Library
            </button>
            <button
              type="button"
              onClick={handleResetSettings}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
            >
              Reset Settings
            </button>
          </div>
        </div>
        {confirmClear ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p>Clear all saved products from your library?</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleClearLibrary}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-rose-700"
              >
                Yes, clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">About</h2>
          <p className="text-sm text-slate-500">
            DropScout stores data locally in your browser for now.
          </p>
        </div>
        <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
          Version: MVP
        </div>
      </section>
    </div>
  );
}
