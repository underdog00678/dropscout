"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { canGenerateNow, incrementWeeklyGenerateCount, isPro } from "@/lib/billing";
import { generateListingContent } from "@/lib/generate";
import { validateProduct } from "@/lib/scoring";
import { loadLibrary } from "@/lib/storage";
import { loadCloudLibrary } from "@/lib/cloudLibrary";
import type { SavedProduct } from "@/lib/storage";
import type { ValidationResult } from "@/lib/types";
import { useSupabaseSession } from "@/lib/useSession";
import UpgradeModal from "@/components/ui/UpgradeModal";

type GeneratedContent = ReturnType<typeof generateListingContent>;
type ExportFormat = "plain" | "shopify" | "amazon";

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

const truncateText = (value: string, limit: number) => {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}…`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function GenerateClient() {
  const [productText, setProductText] = useState("");
  const [library, setLibrary] = useState<SavedProduct[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("plain");
  const [includePositioning, setIncludePositioning] = useState(false);
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [loadDebug, setLoadDebug] = useState<{
    found: boolean;
    ids: string[];
  }>({ found: false, ids: [] });
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingFromLibraryRef = useRef(false);
  const searchParams = useSearchParams();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id ?? null;
  const isDev = process.env.NODE_ENV !== "production";
  const loadId = searchParams.get("load");
  const loadText = searchParams.get("text");

  const generateGate = canGenerateNow(10);
  const generateDisabled = !generateGate.ok;

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  useEffect(() => {
    if (!loadId) {
      setLoadMessage(null);
      return;
    }

    const loadFromLibrary = async () => {
      if (isDev) {
        console.log("[Generate] loaded from library id", loadId);
      }
      try {
        const items = userId ? await loadCloudLibrary(userId) : loadLibrary();
        const saved = items.find(
          (item) => String(item.id) === String(loadId),
        );
        setLoadDebug({
          found: Boolean(saved),
          ids: items.slice(0, 3).map((item) => String(item.id)),
        });
        if (!saved) {
          setLoadMessage(
            "Couldn't find that saved product. It may have been deleted.",
          );
          return;
        }

        isLoadingFromLibraryRef.current = true;
        setProductText(saved.productText);
        clearGenerated();
        setLoadMessage("Loaded from Library.");
        runGeneration(saved.productText);
        isLoadingFromLibraryRef.current = false;
      } catch {
        setLoadMessage("Couldn't find that saved product. Please try again.");
      }
    };

    loadFromLibrary();
  }, [loadId, userId, isDev]);

  useEffect(() => {
    if (!loadText) {
      return;
    }
    const trimmed = loadText.trim();
    if (!trimmed) {
      return;
    }
    clearGenerated();
    setProductText(trimmed);
    setLoadMessage("Loaded product for generation.");
    runGeneration(trimmed);
  }, [loadText]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async (key: string, value: string) => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }

    const fallbackCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    };

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }

    setCopiedKey(key);
    copyTimerRef.current = setTimeout(() => {
      setCopiedKey(null);
    }, 1500);
  };

  const clearGenerated = () => {
    if (content || validation) {
      setContent(null);
      setValidation(null);
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
    if (manualCopyText) {
      setManualCopyText(null);
    }
    if (copiedKey) {
      setCopiedKey(null);
    }
  };

  const handleSelectLibrary = (value: string) => {
    if (!value) {
      return;
    }
    const selected = library.find((item) => item.id === value);
    if (selected) {
      clearGenerated();
      setProductText(selected.productText);
    }
  };

  const runGeneration = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      setErrorMessage("Add a product idea or URL to generate listing content.");
      setValidation(null);
      setContent(null);
      return;
    }

    const gate = canGenerateNow(10);
    if (!gate.ok) {
      setUpgradeMessage(
        "Free accounts can generate up to 10 listings per week. Upgrade to Pro for unlimited generations.",
      );
      setShowUpgradeModal(true);
      return;
    }

    const nextValidation = validateProduct({ productText: trimmed });
    const nextContent = generateListingContent({
      productText: trimmed,
      validation: nextValidation,
    });
    setValidation(nextValidation);
    setContent(nextContent);
    setErrorMessage(null);
    setManualCopyText(null);

    if (!isPro()) {
      const nextCount = incrementWeeklyGenerateCount();
      if (nextCount >= 10) {
        setUpgradeMessage(
          "You just hit the weekly free generation limit. Upgrade to Pro to keep generating.",
        );
        setShowUpgradeModal(true);
      }
    }
  };

  const handleGenerate = () => {
    runGeneration(productText);
  };

  const formatPositioning = (value: GeneratedContent, heading: string) => {
    const upsells =
      value.positioning.upsells.length > 0
        ? value.positioning.upsells.map((item) => `- ${item}`).join("\n")
        : "- None suggested";
    return [
      heading,
      `Audience: ${value.positioning.audience}`,
      `Angle: ${value.positioning.angle}`,
      "Upsells:",
      upsells,
    ].join("\n");
  };

  const formatPlain = (value: GeneratedContent) => {
    const lines = [
      "TITLES",
      ...value.titles.map((title, index) => `${index + 1}) ${title}`),
      "BULLETS",
      ...value.bullets.map((bullet) => `- ${bullet}`),
      "DESCRIPTION",
      value.description,
      "HOOKS",
      ...value.hooks.map((hook) => `- ${hook}`),
      "FAQS",
      ...value.faqs.flatMap((faq) => [`Q: ${faq.q}`, `A: ${faq.a}`]),
    ];

    if (includePositioning) {
      lines.unshift("---");
      lines.unshift(formatPositioning(value, "POSITIONING"));
    }

    return lines.join("\n");
  };

  const formatShopify = (value: GeneratedContent) => {
    const lines = [
      "TITLE SUGGESTION",
      value.titles[0],
      "",
      "HIGHLIGHTS",
      ...value.bullets.map((bullet) => `- ${bullet}`),
      "",
      "DESCRIPTION",
      value.description,
      "",
      "FAQ",
      ...value.faqs.flatMap((faq) => [`Q: ${faq.q}`, `A: ${faq.a}`]),
    ];
    if (includePositioning) {
      lines.push("");
      lines.push(formatPositioning(value, "Positioning Notes (Internal)"));
    }
    return lines.join("\n");
  };

  const formatAmazon = (value: GeneratedContent) => {
    const cleanTitle = value.titles[0]
      .replace(/[!¡?*#]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const includesFaq = value.faqs.find((faq) =>
      faq.q.toLowerCase().includes("included"),
    );
    const returnsFaq = value.faqs.find((faq) =>
      faq.q.toLowerCase().includes("return"),
    );
    const shippingFaq = value.faqs.find((faq) =>
      faq.q.toLowerCase().includes("shipping"),
    );
    const notes = [returnsFaq?.a, shippingFaq?.a]
      .filter(Boolean)
      .join(" ");
    const lines = [
      "TITLE SUGGESTION",
      cleanTitle,
      "",
      "BULLET POINTS",
      ...value.bullets.map((bullet) => `• ${bullet}`),
      "",
      "DESCRIPTION",
      value.description,
      "",
      "PACKAGE INCLUDES / NOTES",
      `Package includes: ${
        includesFaq?.a ?? "See the product details for what is included."
      }`,
      `Notes: ${
        notes || "Review the product details for fit and care guidance."
      }`,
    ];
    if (includePositioning) {
      lines.push("");
      lines.push(formatPositioning(value, "Positioning Notes (Internal)"));
    }
    return lines.join("\n");
  };

  const buildExportText = (
    format: ExportFormat,
    value: GeneratedContent,
  ) => {
    switch (format) {
      case "shopify":
        return formatShopify(value);
      case "amazon":
        return formatAmazon(value);
      default:
        return formatPlain(value);
    }
  };

  const handleCopyEverything = async () => {
    if (!content) return;
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }

    const exportText = buildExportText(exportFormat, content);

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(exportText);
      setManualCopyText(null);
    } catch {
      setManualCopyText(exportText);
    }

    setCopiedKey("export-all");
    copyTimerRef.current = setTimeout(() => {
      setCopiedKey(null);
    }, 1500);
  };

  const copyLabel = (key: string, defaultLabel: string) =>
    copiedKey === key ? "Copied" : defaultLabel;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="text-[11px] text-slate-500">
          loadId: {loadId ?? "—"} · signedIn: {userId ? "true" : "false"} ·
          found: {loadDebug.found ? "true" : "false"} · ids:{" "}
          {loadDebug.ids.length > 0 ? loadDebug.ids.join(", ") : "—"}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Generate
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Generate Listing
        </h1>
        <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
          Turn a validated idea into store-ready copy.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Product input</h2>
            <p className="text-sm text-slate-500">
              Describe the product or drop a URL to generate a listing draft.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-2">
              <label
                htmlFor="product"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Product URL or idea
              </label>
              <textarea
                id="product"
                rows={4}
                value={productText}
                onChange={(event) => {
                  if (
                    (content || validation) &&
                    !isLoadingFromLibraryRef.current
                  ) {
                    clearGenerated();
                  }
                  setProductText(event.target.value);
                }}
                placeholder="e.g. Ergonomic cable management tray for desks"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-3">
              <label
                htmlFor="library"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Load from Library
              </label>
              <select
                id="library"
                onChange={(event) => handleSelectLibrary(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Select a saved product</option>
                {library.length === 0 ? (
                  <option value="" disabled>
                    No saved products yet
                  </option>
                ) : (
                  library.map((item) => (
                    <option key={item.id} value={item.id}>
                      {truncateText(item.productText, 36)} ·{" "}
                      {formatDate(item.createdAt)}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={handleGenerate}
                aria-disabled={generateDisabled}
                className={`h-12 w-full rounded-2xl bg-[var(--brand)] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)] ${
                  generateDisabled ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                Generate Content
              </button>
              {generateDisabled ? (
                <p className="text-xs text-slate-500">
                  Weekly free generation limit reached. Upgrade to continue.
                </p>
              ) : null}
            </div>
          </div>
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          {loadMessage ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              {loadMessage}
            </div>
          ) : null}
        </div>
      </section>

      {content && validation ? (
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Validation summary
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${decisionStyles[validation.decision].className}`}
              >
                {decisionStyles[validation.decision].label}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">{validation.summary}</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Export
                </p>
                <h3 className="text-base font-semibold text-slate-900">
                  Copy everything at once
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Export format
                </label>
                <select
                  value={exportFormat}
                  onChange={(event) => {
                    setExportFormat(event.target.value as ExportFormat);
                    if (manualCopyText) {
                      setManualCopyText(null);
                    }
                  }}
                  className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="plain">Plain</option>
                  <option value="shopify">Shopify</option>
                  <option value="amazon">Amazon</option>
                </select>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <input
                    type="checkbox"
                    checked={includePositioning}
                    onChange={(event) => {
                      setIncludePositioning(event.target.checked);
                      if (manualCopyText) {
                        setManualCopyText(null);
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-emerald-200"
                  />
                  Include positioning in export
                </label>
                <button
                  type="button"
                  onClick={handleCopyEverything}
                  className="h-10 rounded-2xl bg-[var(--brand)] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-[var(--brand-strong)]"
                >
                  {copyLabel("export-all", "Copy Everything")}
                </button>
              </div>
            </div>
            {manualCopyText ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                <p>Clipboard access was blocked. Copy manually below.</p>
                <textarea
                  value={manualCopyText}
                  readOnly
                  rows={8}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Positioning
              </h3>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "positioning",
                    `Audience: ${content.positioning.audience}\nAngle: ${content.positioning.angle}\nUpsells:\n${content.positioning.upsells
                      .map((item) => `- ${item}`)
                      .join("\n") || "- None suggested"}`,
                  )
                }
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
              >
                {copyLabel("positioning", "Copy positioning")}
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Audience
                </p>
                <p className="mt-2 text-slate-700">
                  {content.positioning.audience}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Angle
                </p>
                <p className="mt-2 text-slate-700">
                  {content.positioning.angle}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Upsells
                </p>
                {content.positioning.upsells.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-slate-700">
                    {content.positioning.upsells.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-slate-500">
                    No upsells suggested yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Titles</h3>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy("titles-all", content.titles.join("\n"))
                  }
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                >
                  {copyLabel("titles-all", "Copy all titles")}
                </button>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {content.titles.map((title, index) => (
                  <li
                    key={title}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
                  >
                    <span>{title}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`title-${index}`, title)}
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                    >
                      {copyLabel(`title-${index}`, "Copy")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Bullets</h3>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      "bullets-all",
                      content.bullets.map((item) => `• ${item}`).join("\n"),
                    )
                  }
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                >
                  {copyLabel("bullets-all", "Copy all bullets")}
                </button>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {content.bullets.map((bullet, index) => (
                  <li
                    key={bullet}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
                  >
                    <span>{bullet}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`bullet-${index}`, bullet)}
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                    >
                      {copyLabel(`bullet-${index}`, "Copy")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Description
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy("description", content.description)}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                >
                  {copyLabel("description", "Copy")}
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-700">
                {content.description}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Hooks</h3>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy("hooks-all", content.hooks.join("\n"))
                  }
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                >
                  {copyLabel("hooks-all", "Copy all hooks")}
                </button>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {content.hooks.map((hook, index) => (
                  <li
                    key={hook}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
                  >
                    <span>{hook}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`hook-${index}`, hook)}
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                    >
                      {copyLabel(`hook-${index}`, "Copy")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">FAQs</h3>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      "faqs-all",
                      content.faqs
                        .map((faq) => `Q: ${faq.q}\nA: ${faq.a}`)
                        .join("\n\n"),
                    )
                  }
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                >
                  {copyLabel("faqs-all", "Copy all FAQs")}
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {content.faqs.map((faq, index) => (
                  <div
                    key={faq.q}
                    className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900">{faq.q}</p>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `faq-${index}`,
                            `Q: ${faq.q}\nA: ${faq.a}`,
                          )
                        }
                        className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-700"
                      >
                        {copyLabel(`faq-${index}`, "Copy")}
                      </button>
                    </div>
                    <p className="mt-2 text-slate-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
      <UpgradeModal
        open={showUpgradeModal}
        title="Keep generating listings"
        description={
          upgradeMessage ??
          "Upgrade to Pro to unlock unlimited listing generation."
        }
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
