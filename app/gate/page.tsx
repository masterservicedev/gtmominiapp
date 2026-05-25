"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { PositioningGate } from "@/components/funnel/PositioningGate";
import { normalizeEntryVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getAccentPalette } from "@/lib/funnel/palette";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { loadWebApp } from "@/lib/twa";

function GateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const variant = normalizeEntryVariant(params.get("variant"));
  const cfg = getFunnelConfig(variant);
  const preTotal = getPreQuestionnaireSteps();
  const palette = getAccentPalette(cfg);

  useEffect(() => {
    let cancelled = false;
    void loadWebApp().then((WebApp) => {
      if (cancelled) return;
      if (!WebApp.initData) {
        router.replace("/");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onContinue = useCallback(async () => {
    await trackFunnelEvent("funnel_gate_complete", { variant });
    router.push(`/offer?variant=${encodeURIComponent(variant)}`);
  }, [router, variant]);

  return (
    <PositioningGate
      headline={cfg.positioningGate.headline}
      subcopy={cfg.positioningGate.subcopy}
      ctaLabel={cfg.positioningGate.ctaLabel}
      logoSrc={cfg.positioningGate.logoSrc}
      tickerLines={cfg.socialProofTicker}
      header={
        <FunnelProgress
          current={1}
          total={preTotal}
          label={undefined}
          palette={palette}
        />
      }
      palette={palette}
      onContinue={onContinue}
    />
  );
}

export default function GatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-sm">
          Loading…
        </div>
      }
    >
      <GateInner />
    </Suspense>
  );
}
