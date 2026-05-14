"use client";

/**
 * Assignment only: matched product, funding, three inclusions, compact bonus.
 * Persuasion lives on value-bridge; no emphasis grids or long catalog copy here.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { loadWebApp } from "@/lib/twa";
import type { ProductKey, ProductMatch } from "@/lib/productMatch";
import {
  getBundleSecondaryOptions,
  getCatalogProduct,
} from "@/lib/productCatalog";
import type { Capital } from "@/lib/scoring";

const KEY_INCLUSIONS: Record<ProductKey, string[]> = {
  ebook: [
    "56-page strategy and signal guide",
    "Entry, exit, and risk management explained",
    "Instant digital access",
  ],
  vip: [
    "Daily signals — Gold, Crypto, and FX",
    "Live trade explanations in real time",
    "Community of 10,000+ active traders",
  ],
  fx_basics: [
    "Complete Forex basics curriculum",
    "Channel-style delivery, ongoing content",
    "GTMO team support throughout",
  ],
  education: [
    "Ongoing market insights and analysis",
    "Live context as markets move",
    "Private channel updated regularly",
  ],
  school: [
    "Full video course library — beginner to advanced",
    "Live trading sessions with real positions",
    "Exclusive strategies from the channel trader",
  ],
};

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
  const preSteps = getPreQuestionnaireSteps();
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 px-6 text-center text-white">
        <p className="mb-6 text-sm text-zinc-400">{error}</p>
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-sm text-zinc-400">
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
  const keyInclusions = KEY_INCLUSIONS[pm.productKey] ?? [];

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
        <div className="mb-7">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            You&apos;ve been matched with
          </p>
          <h1 className="mb-1 text-2xl font-bold leading-tight tracking-tight text-zinc-50 md:text-3xl">
            {primary.displayName}
          </h1>
          <p className="text-sm font-medium text-emerald-400/95">
            {primary.tagline}
          </p>
          {capital === "300_1000" ? (
            <p className="mt-2 text-xs leading-snug text-amber-400/90">
              FX Basics or Education — your specialist confirms which fits your
              level.
            </p>
          ) : null}
        </div>

        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">Minimum account funding</p>
            <p className="text-base font-bold text-zinc-50">
              ${pm.depositRequiredUsd}+
            </p>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Your access activates after your account is funded and verified.
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Included with your activation
          </p>
          <div className="space-y-2">
            {keyInclusions.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-xs text-emerald-500">
                  ✓
                </span>
                <p className="text-sm text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {bundleRule ? (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <div className="flex items-start gap-2">
              <span className="text-sm text-amber-400" aria-hidden>
                🎁
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                  Mini app activation bonus
                </p>
                <p className="mt-0.5 text-sm text-zinc-300">
                  {bundleRule.description}
                </p>
                {bundleRule.disclaimer ? (
                  <p className="mt-1 text-xs text-zinc-600">{bundleRule.disclaimer}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/confirm-intent?variant=${encodeURIComponent(variant)}`,
            )
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <ProductMatchInner />
    </Suspense>
  );
}
