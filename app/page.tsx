"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadWebApp } from "@/lib/twa";
import { normalizeEntryVariant } from "@/lib/funnel/normalize";
import { parseStartParam } from "@/lib/startParam";

/** UTM params from Web App URL query (Telegram may open the mini app with ?utm_*=…). */
function utmFromLocationSearch(): {
  utmSource: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
} {
  if (typeof window === "undefined") {
    return { utmSource: null, utmCampaign: null, utmContent: null };
  }
  const q = new URLSearchParams(window.location.search);
  const pick = (k: string) => {
    const v = q.get(k);
    return v && v.trim() ? v.trim() : null;
  };
  return {
    utmSource: pick("utm_source"),
    utmCampaign: pick("utm_campaign"),
    utmContent: pick("utm_content"),
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
        const parsed = parseStartParam(startParam);
        const utm = utmFromLocationSearch();

        return fetch("/api/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData: WebApp.initData,
            startParam,
            voluumCid: parsed.cid,
            entryVariant: parsed.variant,
            utmSource: utm.utmSource,
            utmCampaign: utm.utmCampaign,
            utmContent: utm.utmContent,
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
