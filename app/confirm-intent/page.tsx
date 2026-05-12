"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { loadWebApp } from "@/lib/twa";
import type { ProductMatch } from "@/lib/productMatch";
import { productDisplayName } from "@/lib/leadCardContent";

type Payload = {
  segment: string;
  bundleEligible: boolean;
  bundleUsed: boolean;
  productMatch: ProductMatch;
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
  const totalFunnelSteps = preSteps + 7;
  const progressStep = preSteps + 7;

  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  const onYes = async () => {
    if (!payload || busy) return;
    const pm = payload.productMatch;
    const bundleShown = Boolean(pm.bundleOfferLine);
    setBusy(true);
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
      if (data.handled === "mid_record_only") {
        router.replace(`/result?segment=${encodeURIComponent(seg)}&intent=1`);
      } else {
        router.replace(`/result?segment=${encodeURIComponent(seg)}&handoff=1`);
      }
    } catch {
      setError("Network error");
      setBusy(false);
    }
  };

  const onNo = async () => {
    if (!payload || busy) return;
    setBusy(true);
    try {
      const WebApp = await loadWebApp();
      await fetch("/api/decline-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: WebApp.initData }),
      });
      router.replace(
        `/result?segment=${encodeURIComponent(payload.segment)}&declined=1`,
      );
    } catch {
      setError("Network error");
      setBusy(false);
    }
  };

  if (error && !payload) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-zinc-400 mb-6">{error}</p>
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

  const pm = payload.productMatch;
  const bundleShown = Boolean(pm.bundleOfferLine);

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
          Confirm
        </p>
        <h1 className="mb-4 font-serif text-xl font-normal leading-snug tracking-tight text-zinc-50 md:text-2xl">
          You qualify for {productDisplayName(pm.productKey)}
          {bundleShown && acceptBundle && pm.bonusLine
            ? " with the mini app bundle"
            : ""}
          .
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          To receive this, you&apos;ll need to fund your Vantage account with at
          least ${pm.depositRequiredUsd}. Are you ready to proceed?
        </p>

        {bundleShown ? (
          <label className="mb-8 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={acceptBundle}
              onChange={(e) => setAcceptBundle(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600"
            />
            <span>
              I want the mini app bundle: {pm.bundleOfferLine}
              {pm.bonusLine ? ` (${pm.bonusLine})` : ""}
            </span>
          </label>
        ) : (
          <div className="mb-8" />
        )}

        {error ? (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onYes()}
            className={`w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} text-black ${t.accentBgHover} transition-colors disabled:opacity-50`}
          >
            {busy ? "…" : "Yes — connect me with a specialist"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onNo()}
            className="w-full rounded-xl border border-zinc-700 py-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
          >
            Not right now
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
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
          Loading…
        </div>
      }
    >
      <ConfirmIntentInner />
    </Suspense>
  );
}
