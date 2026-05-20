"use client";

/**
 * Merged activation step: matched access, funding frame, optional bonus toggle,
 * what happens next, and confirm-handoff — no duplicate product catalog sell.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getAccentPalette } from "@/lib/funnel/palette";
import { trackFunnelEvent } from "@/lib/funnel/track";
import { loadWebApp } from "@/lib/twa";
import { getBundleCopy } from "@/lib/bundleCopy";
import {
  qualifiesForCrmHandoff,
  type ProductMatch,
} from "@/lib/productMatch";
import { getCatalogProduct } from "@/lib/productCatalog";
import type { Capital } from "@/lib/scoring";

const WHAT_HAPPENS_NEXT = [
  "Your specialist sends your registration link in this chat",
  "You fund your trading account at the level above",
  "Your access is activated and confirmed here once verified",
] as const;

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
  const palette = getAccentPalette(cfg);
  const t = palette;
  const preSteps = getPreQuestionnaireSteps();
  const totalFunnelSteps = preSteps + 7;
  const progressStep = preSteps + 7;

  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [acceptBundle, setAcceptBundle] = useState<boolean>(true);

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
        const cap = data.capital as Capital;
        if (qualifiesForCrmHandoff(data.segment, cap)) {
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
    if (!payload) return;
    const cap = payload.capital as Capital;
    const tierHasBonus = getBundleCopy(cap) !== null;
    if (tierHasBonus && !payload.bundleUsed) {
      setAcceptBundle(true);
    }
  }, [payload]);

  useEffect(() => {
    if (payload) {
      void trackFunnelEvent("product_match_view", {
        variant,
        productKey: payload.productMatch.productKey,
      });
    }
  }, [payload, variant]);

  const onConfirm = async () => {
    if (!payload || busy) return;
    const pm = payload.productMatch;
    const cap = payload.capital as Capital;
    const tierHasBonus = getBundleCopy(cap) !== null;
    const confirmBundleCopy =
      tierHasBonus && !payload.bundleUsed ? getBundleCopy(cap) : null;
    const bundleShown = confirmBundleCopy !== null;
    setBusy(true);
    setError(null);
    try {
      const WebApp = await loadWebApp();
      const body: Record<string, unknown> = {
        initData: WebApp.initData,
        bundleAccepted: bundleShown ? acceptBundle : null,
      };
      const res = await fetch("/api/confirm-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        setBusy(false);
        return;
      }
      const seg = (data.segment as string) || payload.segment;
      const pk = encodeURIComponent(payload.productMatch.productKey);
      const bundleQ =
        bundleShown && typeof acceptBundle === "boolean"
          ? `&bundle=${acceptBundle ? "1" : "0"}`
          : "";
      if (data.handled === "mid_record_only") {
        router.replace(
          `/result?segment=${encodeURIComponent(seg)}&intent=1&productKey=${pk}${bundleQ}`,
        );
      } else {
        router.replace(
          `/result?segment=${encodeURIComponent(seg)}&handoff=1&productKey=${pk}${bundleQ}`,
        );
      }
    } catch {
      setError("Network error");
      setBusy(false);
    }
  };

  if (error && !payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 px-6 text-center text-white">
        <p className="mb-6 text-sm text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/qualify")}
          className={`rounded-xl px-6 py-3 text-sm font-semibold ${t.accentBg} ${t.accentButtonText}`}
        >
          Back
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
  // Show bonus panel if tier has a bonus AND bundle has not already been used
  const tierHasBonus = getBundleCopy(capital) !== null;
  const bundleCopy =
    tierHasBonus && !payload.bundleUsed ? getBundleCopy(capital) : null;
  const bundleShown = bundleCopy !== null;

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      <div
        className={`pointer-events-none absolute inset-0 ${palette.pageRadialGlow}`}
        aria-hidden
      />
      <div className="relative border-b border-zinc-800/80 bg-black/40 backdrop-blur-sm">
        <FunnelProgress
          current={progressStep}
          total={totalFunnelSteps}
          label={`Step ${progressStep} of ${totalFunnelSteps}`}
          palette={palette}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-8 sm:px-8">
        <div className="mb-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Your access path
          </p>
          <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-zinc-50 md:text-3xl">
            {primary.displayName}
          </h1>
          <p className="mb-1 text-sm leading-relaxed text-zinc-400">
            Based on your answers, this is your matched path.
          </p>
          <p className={`text-sm font-medium ${palette.bridgeHeadline}`}>
            {primary.tagline}
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">Fund your account with</p>
            <p className="text-base font-bold text-zinc-50">
              ${pm.depositRequiredUsd}+
            </p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Your GTMO access activates once your deposit is verified.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            You are funding your own trading account — not purchasing from us.
          </p>
        </div>

        {bundleCopy ? (
          <section
            className={`mb-6 rounded-xl border ${palette.bonusPanelBorder} ${palette.bonusPanelBg} p-4`}
            aria-labelledby="activation-bonus-heading"
          >
              <div className="mb-2 flex items-center gap-2">
                <span className={`text-sm ${palette.bonusPanelAccent}`} aria-hidden>
                  🎁
                </span>
                <p
                  id="activation-bonus-heading"
                  className={`text-xs font-semibold uppercase tracking-widest ${palette.bonusPanelAccent}`}
                >
                  Mini app activation bonus
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-200">
                {bundleCopy.userPanelHeadline}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {bundleCopy.userPanelBody}
              </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setAcceptBundle(true)}
                className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                  acceptBundle
                    ? palette.bundleToggleSelected
                    : "border-zinc-700 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600"
                } disabled:opacity-50`}
              >
                Include activation bonus
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setAcceptBundle(false)}
                className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                  !acceptBundle
                    ? palette.bundleToggleSelected
                    : "border-zinc-700 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600"
                } disabled:opacity-50`}
              >
                Primary access only
              </button>
            </div>
          </section>
        ) : null}

        <div className="mb-6 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            What happens next
          </p>
          <div className="space-y-3">
            {WHAT_HAPPENS_NEXT.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-xs font-medium text-zinc-600">
                  {i + 1}
                </span>
                <p className="text-sm leading-snug text-zinc-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-auto">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
            className={`w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} ${t.accentButtonText} ${t.accentBgHover} transition-colors disabled:opacity-50`}
          >
            {busy
              ? "…"
              : "Confirm and connect me with a specialist →"}
          </button>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-zinc-600">
            Access is activated on deposit confirmation. Trading involves risk.
          </p>
        </div>
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
