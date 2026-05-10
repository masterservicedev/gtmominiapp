"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CodeLandingOffer } from "@/components/funnel/CodeLandingOffer";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { SocialProofTicker } from "@/components/funnel/SocialProofTicker";
import { VideoOffer } from "@/components/funnel/VideoOffer";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import {
  getEffectiveOffer,
  getFunnelConfig,
  getPreQuestionnaireSteps,
} from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { trackFunnelEvent } from "@/lib/funnel/track";

function OfferInner() {
  const router = useRouter();
  const params = useSearchParams();
  const variant = normalizeEntryVariant(params.get("variant"));
  const cfg = getFunnelConfig(variant);
  const offer = getEffectiveOffer(variant as AdVariant);
  const t = getThemeClasses(cfg.theme);
  const preTotal = getPreQuestionnaireSteps(variant as AdVariant);
  const offerStepIndex = variant === "ad2" ? 3 : 2;

  const [videoUnlocked, setVideoUnlocked] = useState(
    offer.mode !== "video"
      ? true
      : !offer.video.src || offer.video.minWatchSeconds <= 0,
  );

  useEffect(() => {
    if (offer.mode !== "video") {
      setVideoUnlocked(true);
      return;
    }
    setVideoUnlocked(!offer.video.src || offer.video.minWatchSeconds <= 0);
  }, [offer]);

  useEffect(() => {
    trackFunnelEvent("offer_view", { variant, surface: "offer_page" });
  }, [variant]);

  const onContinue = useCallback(async () => {
    await trackFunnelEvent("offer_complete", { variant });
    router.push(`/qualify?variant=${encodeURIComponent(variant)}`);
  }, [router, variant]);

  if (offer.mode === "code_landing") {
    return (
      <CodeLandingOffer
        offer={offer}
        variant={variant as AdVariant}
        theme={cfg.theme ?? "amber"}
        progressCurrent={offerStepIndex}
        progressTotal={preTotal}
      />
    );
  }

  const stepLabel =
    offer.mode === "video" ? "brief" : "overview";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-8">
      {cfg.socialProofTicker?.length ? (
        <SocialProofTicker lines={cfg.socialProofTicker} />
      ) : null}
      <FunnelProgress
        current={offerStepIndex}
        total={preTotal}
        label={`Step ${offerStepIndex} — ${stepLabel}`}
        theme={cfg.theme}
      />

      <div className="flex-1 px-6 pt-6 max-w-lg mx-auto w-full space-y-6">
        <header>
          <h1 className="text-xl font-bold tracking-tight leading-snug">
            {offer.heroTitle}
          </h1>
          {offer.heroSub ? (
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              {offer.heroSub}
            </p>
          ) : null}
        </header>

        {offer.mode === "video" ? (
          <VideoOffer
            src={offer.video.src}
            poster={offer.video.poster}
            minWatchSeconds={offer.video.minWatchSeconds}
            theme={cfg.theme}
            onUnlockReady={setVideoUnlocked}
            onThresholdMet={(seconds) =>
              trackFunnelEvent("offer_watched", {
                variant,
                seconds_watched: seconds,
              })
            }
          />
        ) : (
          <ul className="space-y-3 text-sm text-zinc-300">
            {offer.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className={`shrink-0 ${t.accentText}`}>•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {offer.mode === "video" && offer.authority ? (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-semibold text-white mb-2">
              {offer.authority.title}
            </h2>
            {offer.authority.body.map((p) => (
              <p key={p} className="text-xs text-zinc-400 leading-relaxed mb-2 last:mb-0">
                {p}
              </p>
            ))}
          </section>
        ) : null}

        {offer.mode === "video" && offer.supportingCopy?.length ? (
          <div className="text-xs text-zinc-500 space-y-1">
            {offer.supportingCopy.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}

        {offer.mode === "video" && offer.riskShort ? (
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            {offer.riskShort}
          </p>
        ) : null}

        <button
          type="button"
          disabled={offer.mode === "video" && !videoUnlocked}
          onClick={onContinue}
          className={`w-full py-4 rounded-xl font-semibold text-sm transition-colors ${
            offer.mode === "video" && !videoUnlocked
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : `${t.accentBg} text-black ${t.accentBgHover}`
          }`}
        >
          {offer.ctaLabel}
        </button>
      </div>
    </div>
  );
}

export default function OfferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-sm">
          Loading…
        </div>
      }
    >
      <OfferInner />
    </Suspense>
  );
}
