"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { PositioningGate } from "@/components/funnel/PositioningGate";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { trackFunnelEvent } from "@/lib/funnel/track";

function GateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const variant = normalizeEntryVariant(params.get("variant"));
  const cfg = getFunnelConfig(variant);
  const preTotal = getPreQuestionnaireSteps(variant as AdVariant);

  const onContinue = useCallback(async () => {
    await trackFunnelEvent("funnel_gate_complete", { variant });
    if (variant === "ad2") {
      router.push(`/prelander?variant=${encodeURIComponent(variant)}`);
    } else {
      router.push(`/offer?variant=${encodeURIComponent(variant)}`);
    }
  }, [router, variant]);

  return (
    <PositioningGate
      headline={cfg.positioningGate.headline}
      subcopy={cfg.positioningGate.subcopy}
      ctaLabel={cfg.positioningGate.ctaLabel}
      tickerLines={cfg.socialProofTicker}
      header={
        <FunnelProgress
          current={1}
          total={preTotal}
          label="Step 1 — positioning"
          theme={cfg.theme}
        />
      }
      theme={cfg.theme}
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
