"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VideoEntry } from "@/components/VideoEntry";
import { LPEntry } from "@/components/LPEntry";
import { loadWebApp } from "@/lib/twa";

function parseStartParam(startParam: string) {
  const parts = startParam.split("_");
  return {
    cid: parts[1] || null,
    variant: parts[2] || null,
  };
}

export default function EntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<string | null>(null);

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
            setVariant(data.variant);
            setLoading(false);

            fetch("/api/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                initData: WebApp.initData,
                eventType: "offer_view",
                metadata: { variant: data.variant },
              }),
            }).catch(() => {});
          });
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white text-sm">Loading...</div>
      </div>
    );
  }

  const v = variant || "default";
  return v.startsWith("vid") ? (
    <VideoEntry variant={v} onContinue={() => router.push("/qualify")} />
  ) : (
    <LPEntry variant={v} onContinue={() => router.push("/qualify")} />
  );
}
