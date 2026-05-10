"use client";

import { Suspense, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { SocialProofTicker } from "@/components/funnel/SocialProofTicker";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { trackFunnelEvent } from "@/lib/funnel/track";

function PrelanderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const variant = normalizeEntryVariant(params.get("variant"));
  const cfg = getFunnelConfig(variant);
  const t = getThemeClasses(cfg.theme);
  const preTotal = getPreQuestionnaireSteps(variant as AdVariant);

  useEffect(() => {
    if (variant !== "ad2") {
      router.replace(`/offer?variant=${encodeURIComponent(variant)}`);
      return;
    }
    trackFunnelEvent("prelander_view", { variant });
  }, [router, variant]);

  const onContinue = useCallback(async () => {
    await trackFunnelEvent("prelander_complete", { variant });
    router.push(`/offer?variant=${encodeURIComponent(variant)}`);
  }, [router, variant]);

  if (variant !== "ad2" || !cfg.prelander) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-zinc-500 text-sm">
        Redirecting…
      </div>
    );
  }

  const { prelander } = cfg;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {cfg.socialProofTicker?.length ? (
        <SocialProofTicker lines={cfg.socialProofTicker} />
      ) : null}
      <FunnelProgress
        current={2}
        total={preTotal}
        label="Step 2 — quick context"
        theme={cfg.theme}
      />
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-tight mb-4 leading-tight">
          {prelander.headline}
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-10">
          {prelander.body}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className={`w-full py-4 rounded-xl font-semibold text-sm ${t.accentBg} text-black ${t.accentBgHover} transition-colors`}
        >
          {prelander.ctaLabel}
        </button>
      </div>
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
