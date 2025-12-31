import Link from "next/link";
import SessionStatus from "@/components/auth/SessionStatus";

const navItems = [
  { label: "Dashboard", href: "/app" },
  { label: "Library", href: "/app/library" },
  { label: "Generate", href: "/app/generate" },
  { label: "Settings", href: "/app/settings" },
];

export default function SidebarNav() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)] text-base font-semibold text-white">
          DS
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">DropScout</p>
          <p className="text-xs text-slate-500">Decision dashboard</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2" aria-label="Primary">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-[var(--surface-muted)] hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <SessionStatus />
      </div>
    </div>
  );
}
