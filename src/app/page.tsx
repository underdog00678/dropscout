import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[color:var(--foreground)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#d8f1e4] blur-3xl opacity-70" />
        <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-[#f6e7c7] blur-3xl opacity-70" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#dce7fb] blur-[140px] opacity-60" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:py-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-semibold text-white">
              DS
            </div>
            <span className="text-base font-semibold text-slate-900">
              DropScout
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 sm:flex">
            <Link href="/pricing" className="transition hover:text-slate-900">
              Pricing
            </Link>
          </nav>
        </header>

        <main className="flex flex-1 flex-col justify-center py-14">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex w-fit items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm ring-1 ring-black/5">
                Decision-first validation
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                Decide What to Sell — Before You Build It
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                DropScout helps dropshippers validate product ideas fast, scoring
                demand, competition, margin, and shipping risk with a clear
                Green, Yellow, or Red decision.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)]"
                >
                  Start validating
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
                >
                  View pricing
                </Link>
                <div className="text-sm text-slate-600">
                  Friendly clarity without the spreadsheet overload.
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Decision preview
                </p>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Green
                </span>
              </div>
              <div className="mt-6 space-y-3 text-sm">
                {[
                  { label: "Demand", value: "Strong" },
                  { label: "Competition", value: "Balanced" },
                  { label: "Margin", value: "Healthy" },
                  { label: "Shipping Risk", value: "Low" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)] px-4 py-3"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-semibold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-xs text-slate-600">
                Clear reasoning keeps you aligned on the next move.
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Signal first",
                copy: "Know quickly if the product deserves deeper testing.",
              },
              {
                title: "Decision focused",
                copy: "Green, Yellow, Red — with the why attached.",
              },
              {
                title: "Built for dropshippers",
                copy: "Designed around margins, shipping risk, and speed.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm ring-1 ring-black/5"
              >
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-slate-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
