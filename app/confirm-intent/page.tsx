"use client";

/**
 * Operational confirmation only: facts, specialist steps, activate / decline.
 * No tier summary re-sell blocks; match data comes from POST /api/post-qualify.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
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

function ConfirmIntentInner() {
  const router = useRouter();
  const params = useSearchParams();
  const variant = normalizeEntryVariant(params.get("variant")) as AdVariant;
  const cfg = getFunnelConfig(variant);
  const t = getThemeClasses(cfg.theme);
  const preSteps = getPreQuestionnaireSteps(variant);
  const totalFunnelSteps = preSteps + 8;
  const progressStep = preSteps + 8;

  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [declineBusy, setDeclineBusy] = useState(false);
  const [acceptBundle, setAcceptBundle] = useState(false);

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
          `/result?segment=${encodeURIComponent(data.segment)}&declined=1&productKey=${pk}`,
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
    if (payload?.productMatch.bundleOfferLine) {
      setAcceptBundle(true);
    }
  }, [payload]);

  const onYes = async () => {
    if (!payload || busy || declineBusy) return;
    const pm = payload.productMatch;
    const bundleShown = Boolean(pm.bundleOfferLine);
    setBusy(true);
    setError(null);
    try {
      const WebApp = await loadWebApp();
      const body: Record<string, unknown> = { initData: WebApp.initData };
      if (bundleShown) {
        body.bundleAccepted = acceptBundle;
      }
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

  const onNotNow = async () => {
    if (!payload || busy || declineBusy) return;
    setDeclineBusy(true);
    setError(null);
    try {
      const WebApp = await loadWebApp();
      const res = await fetch("/api/decline-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: WebApp.initData }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* empty */
      }
      if (!res.ok) {
        setError(data.error || "Could not update preference");
        setDeclineBusy(false);
        return;
      }
      const pk = encodeURIComponent(payload.productMatch.productKey);
      router.replace(
        `/result?segment=${encodeURIComponent(payload.segment)}&declined=1&productKey=${pk}`,
      );
    } catch {
      setError("Network error");
      setDeclineBusy(false);
    }
  };

  if (error && !payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 px-6 text-center text-white">
        <p className="mb-6 text-sm text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/qualify")}
          className={`rounded-xl px-6 py-3 text-sm font-semibold ${t.accentBg} text-black`}
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
  const bundleShown = Boolean(pm.bundleOfferLine);
  const capital = payload.capital as Capital;
  const primary = getCatalogProduct(pm.productKey);
  const bundleRule = bundleShown
    ? getBundleSecondaryOptions(capital)
    : null;

  const specialistSteps: string[] = [
    "Send your Vantage registration link",
    "Confirm your account funding level",
    "Activate your GTMO access after your deposit is verified",
  ];
  if (bundleShown && acceptBundle) {
    specialistSteps.push(
      "Confirm your mini app bonus selection when you speak with your specialist",
    );
  }

  const locked = busy || declineBusy;

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
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Confirm your activation path
        </p>
        <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-zinc-50">
          {primary.displayName}
        </h1>
        {bundleShown ? (
          <p className="mb-5 text-sm font-medium text-amber-400/95">
            + {pm.bundleOfferLine}
          </p>
        ) : (
          <div className="mb-5" aria-hidden />
        )}

        {bundleShown ? (
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={locked}
              onClick={() => setAcceptBundle(true)}
              className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                acceptBundle
                  ? "border-amber-500 bg-amber-500/20 text-amber-100"
                  : "border-zinc-700 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600"
              } disabled:opacity-50`}
            >
              Include add-on
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => setAcceptBundle(false)}
              className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                !acceptBundle
                  ? "border-zinc-400 bg-zinc-800/80 text-zinc-100"
                  : "border-zinc-700 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600"
              } disabled:opacity-50`}
            >
              Primary only
            </button>
          </div>
        ) : null}

        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/90 p-4">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 py-2.5">
            <p className="text-sm text-zinc-400">Access</p>
            <p className="text-right text-sm font-semibold text-zinc-100">
              {primary.displayName}
            </p>
          </div>
          {bundleShown && acceptBundle && bundleRule ? (
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 py-2.5">
              <p className="text-sm text-zinc-400">Bonus</p>
              <p className="text-right text-sm font-semibold uppercase tracking-wide text-amber-400">
                {bundleRule.discountLabel}
              </p>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 py-2.5">
            <p className="text-sm text-zinc-400">Minimum account funding</p>
            <p className="text-right text-sm font-bold text-zinc-50">
              ${pm.depositRequiredUsd}+ via Vantage
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Your specialist will
          </p>
          <div className="space-y-3">
            {specialistSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-xs font-medium text-zinc-600">
                  {i + 1}
                </span>
                <p className="text-sm leading-snug text-zinc-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mb-4 text-center text-[10px] leading-relaxed text-zinc-600">
          Access is activated on deposit confirmation. Past performance does not
          guarantee future results. Trading involves risk.
        </p>

        {error ? (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-3">
          <button
            type="button"
            disabled={locked}
            onClick={() => void onYes()}
            className={`w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} text-black ${t.accentBgHover} transition-colors disabled:opacity-50`}
          >
            {busy ? "…" : "Activate my access"}
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => void onNotNow()}
            className="w-full rounded-xl border border-zinc-800 py-3 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400 disabled:opacity-50"
          >
            {declineBusy ? "…" : "Not right now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmIntentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <ConfirmIntentInner />
    </Suspense>
  );
}
