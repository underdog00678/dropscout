"use client";

import Link from "next/link";

type UpgradeModalProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
};

export default function UpgradeModal({
  open,
  title,
  description,
  onClose,
}: UpgradeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close upgrade modal"
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
        >
          ✕
        </button>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Upgrade
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing#waitlist"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)]"
            >
              Join Pro waitlist
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
