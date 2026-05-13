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
import {
  getBundleSecondaryOptions,
  getCatalogProduct,
} from "@/lib/productCatalog";
import type { Capital } from "@/lib/scoring";

type Payload = {
  segment: string;
  capital: string;
  bundleEligible: boolean;
  bundleUsed: boolean;
  bundleOfferShown: boolean;
  bundleAccepted: boolean | null;
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
  const totalFunnelSteps = preSteps + 8;
  const progressStep = preSteps + 7;

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
      if (data.intentConfirmedAt) {
        const pk = encodeURIComponent(data.productMatch?.productKey ?? "");
        const bundleQ =
          data.bundleOfferShown && data.bundleAccepted === true
            ? "&bundle=1"
            : data.bundleOfferShown && data.bundleAccepted === false
              ? "&bundle=0"
              : "";
        const seg = encodeURIComponent(data.segment);
        if (data.segment === "HIGH") {
          router.replace(
            `/result?segment=${seg}&handoff=1&productKey=${pk}${bundleQ}`,
          );
        } else {
          router.replace(
            `/result?segment=${seg}&intent=1&productKey=${pk}${bundleQ}`,
          );
        }
        return;
      }
      if (data.intentDeclinedAt) {
        const pk = encodeURIComponent(data.productMatch?.productKey ?? "");
        router.replace(
          `/result?segment=${data.segment}&declined=1&productKey=${pk}`,
        );
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
  const capital = payload.capital as Capital;
  const primary = getCatalogProduct(pm.productKey);
  const bundleRule =
    pm.bundleOfferLine && pm.bonusLine
      ? getBundleSecondaryOptions(capital)
      : null;

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
          Your recommended access path
        </p>
        <h1 className="mb-5 font-serif text-xl font-normal leading-snug tracking-tight text-zinc-50 md:text-2xl">
          Based on your answers, we&apos;ve matched you with the support level
          that fits your starting capital, experience, and readiness.
        </h1>

        <div className="mb-5 rounded-xl border border-zinc-700/50 bg-zinc-900/40 p-4">
          <p className="text-sm leading-relaxed text-zinc-300">
            <span className="font-semibold text-zinc-50">
              You are not paying for a course.
            </span>{" "}
            Your funding goes into your own trading account with Vantage. GTMO
            access is activated as part of the partnership after your account is
            funded and verified by our team.
          </p>
        </div>

        <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                Access activated
              </p>
              <h2 className="text-lg font-semibold text-zinc-50">
                {primary.displayName}
              </h2>
              <p className="text-sm text-emerald-400/95 font-medium mt-0.5">
                {primary.tagline}
              </p>
              {capital === "300_1000" ? (
                <p className="text-xs text-amber-400/90 mt-2 leading-snug">
                  Also available at this tier: FX Basics or Education — your
                  specialist confirms which fits your level.
                </p>
              ) : null}
            </div>
            <div className="shrink-0 max-w-[46%] rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-right sm:max-w-none">
              <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-emerald-400/90 sm:text-xs">
                Minimum account funding
              </p>
              <p className="text-xs font-semibold text-emerald-400 sm:text-sm">
                ${pm.depositRequiredUsd}+
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-400 mt-3 mb-4 leading-relaxed">
            {primary.oneLiner}
          </p>

          <div className="space-y-2 mb-4">
            {primary.benefitBullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 text-xs shrink-0">
                  ✓
                </span>
                <p className="text-sm text-zinc-300 leading-snug">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
              How your access is structured
            </p>
            <p className="text-[10px] text-zinc-600 mb-2">
              Illustrative mix of content — not profit odds or guarantees.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-lg bg-black/60 border border-zinc-800 p-2 text-center">
                <p className="text-base font-bold text-zinc-100">
                  {primary.emphasis.structured}%
                </p>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Structured learning
                </p>
              </div>
              <div className="rounded-lg bg-black/60 border border-zinc-800 p-2 text-center">
                <p className="text-base font-bold text-zinc-100">
                  {primary.emphasis.live}%
                </p>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Live engagement
                </p>
              </div>
              <div className="rounded-lg bg-black/60 border border-zinc-800 p-2 text-center">
                <p className="text-base font-bold text-zinc-100">
                  {primary.emphasis.community}%
                </p>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Community &amp; signals
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 italic">
              {primary.emphasis.label}
            </p>
          </div>
        </section>

        {bundleRule ? (
          <section
            className="mb-4 rounded-2xl border border-amber-500/35 bg-amber-950/20 p-5 ring-1 ring-amber-500/15"
            aria-labelledby="bundle-heading"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400 text-sm" aria-hidden>
                🎁
              </span>
              <h2
                id="bundle-heading"
                className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400"
              >
                Mini app exclusive
              </h2>
            </div>
            <h3 className="text-base font-semibold text-amber-50 mb-1">
              {bundleRule.description}
            </h3>
            <p className="text-sm text-amber-100/80 mb-4 leading-relaxed">
              Because you applied through the mini app, you qualify for this on
              your first deposit only.
            </p>
            {bundleRule.eligibleKeys.length > 0 ? (
              <div>
                <p className="text-[10px] text-amber-200/70 uppercase tracking-widest mb-3">
                  {bundleRule.eligibleKeys.length === 1
                    ? "Included add-on"
                    : `Eligible add-ons — ${bundleRule.discountLabel}`}
                </p>
                <div className="space-y-2">
                  {bundleRule.eligibleKeys.map((key) => {
                    const p = getCatalogProduct(key);
                    return (
                      <div
                        key={key}
                        className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-black/40 p-3"
                      >
                        <div className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">
                            {bundleRule.discountLabel}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-100">
                            {p.displayName}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                            {p.oneLiner}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                  * {bundleRule.disclaimer}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        <p className="text-[10px] text-zinc-600 text-center mb-6 leading-relaxed">
          Programme emphasis percentages are illustrative of content structure
          and do not represent profit probabilities or guaranteed returns.
          Trading involves risk.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(`/confirm-intent?variant=${encodeURIComponent(variant)}`)
          }
          className={`mt-auto w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} text-black ${t.accentBgHover} transition-colors`}
        >
          Continue to activation →
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
