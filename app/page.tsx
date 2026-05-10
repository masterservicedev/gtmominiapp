"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadWebApp } from "@/lib/twa";
import { normalizeEntryVariant } from "@/lib/funnel/normalize";

function parseStartParam(startParam: string) {
  const parts = startParam.split("_");
  return {
    cid: parts[1] || null,
    variant: parts[2] || null,
  };
}

export default function EntryPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    loadWebApp()
      .then((WebApp) => {
        if (cancelled) return;
        WebApp.ready();
        WebApp.expand();

        const startParam = WebApp.initDataUnsafe?.start_param || "";
        const { cid, variant: v } = parseStartParam(startParam);

        return fetch("/api/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData: WebApp.initData,
            voluumCid: cid,
            entryVariant: v,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return;
            if (data.error) return;
            const variant = normalizeEntryVariant(data.variant);
            router.replace(`/gate?variant=${encodeURIComponent(variant)}`);
          });
      })
      .catch(() => {
        /* handled by loading UI timeout — user can refresh */
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-white text-sm">Loading...</div>
    </div>
  );
}
