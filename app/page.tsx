"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadWebApp } from "@/lib/twa";
import { normalizeEntryVariant } from "@/lib/funnel/normalize";

/** True when this segment is meant as a funnel variant (ad4, code, etc.). */
function looksLikeVariantSegment(s: string): boolean {
  const v = s.trim().toLowerCase();
  if (!v) return false;
  if (v === "code" || v === "gtmocode") return true;
  return /^ad\d+$/.test(v);
}

/**
 * Voluum-style: prefix_clickid_variant (3+ parts → cid at [1], variant at [2]).
 * Also: clickid_variant (2 parts) or single startapp=ad4 (1 part).
 * Single unknown token → treat as click id only (not forced to ad1).
 */
function parseStartParam(startParam: string) {
  const raw = (startParam || "").trim();
  if (!raw || raw.startsWith("ref_")) {
    return { cid: null, variant: null };
  }
  const parts = raw.split("_").filter((p) => p.length > 0);
  const n = parts.length;

  if (n >= 3) {
    return { cid: parts[1] ?? null, variant: parts[2] ?? null };
  }
  if (n === 2) {
    return { cid: parts[0] ?? null, variant: parts[1] ?? null };
  }
  if (n === 1) {
    const only = parts[0]!;
    if (looksLikeVariantSegment(only)) {
      return { cid: null, variant: only };
    }
    return { cid: only, variant: null };
  }
  return { cid: null, variant: null };
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
