import { Suspense } from "react";
import GenerateClient from "./GenerateClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <GenerateClient />
    </Suspense>
  );
}