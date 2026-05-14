"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeEntryVariant } from "@/lib/funnel/normalize";

/**
 * Legacy route: prelander is no longer used (ad4/ad5 only).
 * Preserves `variant` query for old bookmarks.
 */
function PrelanderInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const variant = normalizeEntryVariant(params.get("variant"));
    router.replace(`/offer?variant=${encodeURIComponent(variant)}`);
  }, [router, params]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-zinc-500 text-sm">
      Redirecting…
    </div>
  );
}

export default function PrelanderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-sm">
          Loading…
        </div>
      }
    >
      <PrelanderInner />
    </Suspense>
  );
}
