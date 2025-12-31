export const dynamic = "force-dynamic";
import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
