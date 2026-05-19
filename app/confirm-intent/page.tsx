"use client";

/**
 * Legacy route — activation confirm merged into /product-match.
 */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ConfirmIntentRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const qs = params.toString();
    router.replace(qs ? `/product-match?${qs}` : "/product-match");
  }, [router, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-sm text-zinc-400">
      Loading…
    </div>
  );
}

export default function ConfirmIntentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <ConfirmIntentRedirect />
    </Suspense>
  );
}
