import type { ReactNode } from "react";

import SidebarNav from "./SidebarNav";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row">
        <aside className="lg:w-64">
          <div className="sticky top-6 rounded-3xl bg-[var(--surface)] p-5 shadow-sm ring-1 ring-black/5">
            <SidebarNav />
          </div>
        </aside>
        <main className="flex-1 rounded-3xl bg-[var(--surface)] p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
