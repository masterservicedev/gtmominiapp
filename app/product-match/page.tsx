"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { loadWebApp } from "@/lib/twa";
import type { ProductMatch } from "@/lib/productMatch";
import { productDisplayName } from "@/lib/leadCardContent";

type Payload = {
  segment: string;
  capital: string;
  bundleEligible: boolean;
  bundleUsed: boolean;
  productMatch: ProductMatch;
  score: number | null;
  alreadyCrm: boolean;
  intentConfirmedAt: string | null;
  intentDeclinedAt: string | null;
};

function ProductMatchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const variant = normalizeEntryVariant(params.get("variant")) as AdVariant;
  const cfg = getFunnelConfig(variant);
  const t = getThemeClasses(cfg.theme);
  const preSteps = getPreQuestionnaireSteps(variant);
  const totalFunnelSteps = preSteps + 7;
  const progressStep = preSteps + 6;

  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const WebApp = await loadWebApp();
      const res = await fetch("/api/post-qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: WebApp.initData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load");
        return;
      }
      setPayload(data as Payload);
      if (data.intentConfirmedAt || data.alreadyCrm) {
        router.replace(`/result?segment=${data.segment}&handoff=1`);
        return;
      }
      if (data.intentDeclinedAt) {
        router.replace(`/result?segment=${data.segment}&declined=1`);
        return;
      }
    } catch {
      setError("Session error");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (payload) {
      void trackFunnelEvent("product_match_view", {
        variant,
        productKey: payload.productMatch.productKey,
      });
    }
  }, [payload, variant]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-zinc-400 mb-6">{error}</p>
        <button
          type="button"
          onClick={() => router.replace(`/result?segment=LOW`)}
          className={`rounded-xl px-6 py-3 text-sm font-semibold ${t.accentBg} text-black`}
        >
          Continue
        </button>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

  const pm = payload.productMatch;

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,158,11,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative border-b border-zinc-800/80 bg-black/40 backdrop-blur-sm">
        <FunnelProgress
          current={progressStep}
          total={totalFunnelSteps}
          label={`Step ${progressStep} of ${totalFunnelSteps}`}
          theme={cfg.theme}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-8 sm:px-8">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-500/90">
          Your match
        </p>
        <h1 className="mb-4 font-serif text-2xl font-normal leading-snug tracking-tight text-zinc-50">
          {pm.primaryTitle}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          {pm.primaryLine}
        </p>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm">
          <p className="font-semibold text-zinc-200">
            Minimum funding: ${pm.depositRequiredUsd}
          </p>
          <p className="mt-1 text-zinc-500">
            Product: {productDisplayName(pm.productKey)}
          </p>
          {pm.bundleOfferLine ? (
            <p className="mt-3 text-amber-200/90">
              Mini app bundle: {pm.bundleOfferLine}
              {pm.bonusLine ? ` — ${pm.bonusLine}` : null}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(`/confirm-intent?variant=${encodeURIComponent(variant)}`)
          }
          className={`mt-auto w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} text-black ${t.accentBgHover} transition-colors`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default function ProductMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
          Loading…
        </div>
      }
    >
      <ProductMatchInner />
    </Suspense>
  );
}
