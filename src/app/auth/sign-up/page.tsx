import { Suspense } from "react";

import SignUpClient from "./SignUpClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <SignUpClient />
    </Suspense>
  );
}
