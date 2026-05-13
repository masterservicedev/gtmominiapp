"use client";

import type { ReactNode } from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { loadWebApp } from "@/lib/twa";
import type { ProductMatch } from "@/lib/productMatch";
import type { Capital } from "@/lib/scoring";

type Payload = {
  segment: string;
  capital: string;
  bundleEligible: boolean;
  bundleUsed: boolean;
  bundleOfferShown: boolean;
  bundleAccepted: boolean | null;
  productMatch: ProductMatch;
  alreadyCrm: boolean;
  intentConfirmedAt: string | null;
  intentDeclinedAt: string | null;
};

function SummaryRow({
  name,
  tagline,
  badge,
  badgeColor,
}: {
  name: string;
  tagline: string;
  badge: string;
  badgeColor: "emerald" | "amber";
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-zinc-800 last:border-0">
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-sm font-semibold leading-snug text-zinc-100">{name}</p>
        <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{tagline}</p>
      </div>
      <span
        className={`text-[10px] font-semibold shrink-0 uppercase tracking-wide ${
          badgeColor === "amber" ? "text-amber-400" : "text-emerald-400"
        }`}
      >
        {badge}
      </span>
    </div>
  );
}

function SummaryNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-zinc-500 pt-2 pb-1 leading-relaxed italic">
      * {children}
    </p>
  );
}

function SummaryUnder100({ bundle }: { bundle: boolean }) {
  return (
    <>
      <SummaryRow
        name="GTMO Ebook"
        tagline="5 Steps to Trading GTMO Signals"
        badge="Included"
        badgeColor="emerald"
      />
      {bundle ? (
        <SummaryNote>
          10% off your next product — applied at time of purchase. Confirmed
          with your specialist.
        </SummaryNote>
      ) : null}
    </>
  );
}

function Summary100300({ bundle }: { bundle: boolean }) {
  return (
    <>
      <SummaryRow
        name="GTMO VIP"
        tagline="Live Signals. Real Edge. Daily."
        badge="Included"
        badgeColor="emerald"
      />
      {bundle ? (
        <SummaryRow
          name="GTMO Ebook"
          tagline="5 Steps to Trading GTMO Signals"
          badge="Free"
          badgeColor="amber"
        />
      ) : null}
    </>
  );
}

function Summary3001000({ bundle }: { bundle: boolean }) {
  return (
    <>
      <SummaryRow
        name="FX Basics or GTMO Education"
        tagline="Your specialist confirms which fits your level"
        badge="Included"
        badgeColor="emerald"
      />
      {bundle ? (
        <>
          <SummaryRow
            name="One additional product of your choice"
            tagline="Ebook · VIP · FX Basics · Education · School"
            badge="50% off"
            badgeColor="amber"
          />
          <SummaryNote>
            Your second product is chosen with your specialist and excludes your
            primary selection.
          </SummaryNote>
        </>
      ) : null}
    </>
  );
}

function Summary1000Plus({ bundle }: { bundle: boolean }) {
  return (
    <>
      <SummaryRow
        name="GTMO School"
        tagline="The Complete Trading Programme"
        badge="Included"
        badgeColor="emerald"
      />
      {bundle ? (
        <>
          <SummaryRow
            name="One additional product of your choice"
            tagline="Ebook · VIP · FX Basics · Education"
            badge="Free"
            badgeColor="amber"
          />
          <SummaryNote>
            Choose your free product when speaking with your specialist.
            Activated on deposit confirmation.
          </SummaryNote>
        </>
      ) : null}
    </>
  );
}

function getNextSteps(capital: Capital, bundle: boolean): string[] {
  const base = [
    "Your specialist sends the correct Vantage registration link",
    "You fund your account at the minimum required level",
    "Your GTMO access is activated after your deposit is verified by our team",
  ];

  if (capital === "300_1000" && bundle) {
    return [
      ...base,
      "Your specialist confirms which primary product fits your level",
      "You choose your discounted second product at that point",
    ];
  }

  if (capital === "1000_plus" && bundle) {
    return [
      ...base,
      "You choose your free additional product with your specialist",
    ];
  }

  if (capital === "100_300" && bundle) {
    return [
      ...base,
      "Ebook access is activated alongside VIP once deposit is confirmed",
    ];
  }

  return base;
}

function TierSummary({
  capital,
  bundle,
}: {
  capital: Capital;
  bundle: boolean;
}) {
  switch (capital) {
    case "under_100":
      return <SummaryUnder100 bundle={bundle} />;
    case "100_300":
      return <Summary100300 bundle={bundle} />;
    case "300_1000":
      return <Summary3001000 bundle={bundle} />;
    case "1000_plus":
      return <Summary1000Plus bundle={bundle} />;
    default:
      return <SummaryUnder100 bundle={bundle} />;
  }
}

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
  const capital = payload.capital as Capital;
  const bundleForSummary = bundleShown && acceptBundle;
  const nextSteps = getNextSteps(capital, bundleForSummary);

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
          Final step
        </p>
        <h1 className="mb-3 font-serif text-xl font-normal leading-snug tracking-tight text-zinc-50 md:text-2xl">
          Confirm your activation path
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          You&apos;ve been matched with your access level. Your specialist will
          send the correct Vantage registration link, confirm your funding
          level, and activate your GTMO access after your account deposit is
          verified.
        </p>

        {bundleShown ? (
          <div className="mb-6 space-y-3">
            <div className="rounded-xl border border-amber-500/35 bg-amber-950/20 p-4 ring-1 ring-amber-500/15">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                Mini app exclusive add-on
              </p>
              <p className="mt-2 text-sm font-semibold text-amber-100">
                {pm.bundleOfferLine}
              </p>
              {pm.bonusLine ? (
                <p className="mt-1 text-sm text-amber-100/85">{pm.bonusLine}</p>
              ) : null}
              <p className="mt-3 text-xs text-zinc-500">
                Choose whether to include this with your application (defaults
                to included).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAcceptBundle(true)}
                className={`rounded-xl border py-3 text-xs font-semibold transition-colors sm:text-sm ${
                  acceptBundle
                    ? "border-amber-500 bg-amber-500/20 text-amber-100"
                    : "border-zinc-700 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                Include add-on
              </button>
              <button
                type="button"
                onClick={() => setAcceptBundle(false)}
                className={`rounded-xl border py-3 text-xs font-semibold transition-colors sm:text-sm ${
                  !acceptBundle
                    ? "border-zinc-400 bg-zinc-800/80 text-zinc-100"
                    : "border-zinc-700 bg-zinc-950/50 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                Primary only
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 mb-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
            Access activated on funding
          </p>
          <TierSummary capital={capital} bundle={bundleForSummary} />
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-800">
            <p className="text-sm text-zinc-400">Minimum account funding</p>
            <p className="text-base font-bold text-zinc-50">
              ${pm.depositRequiredUsd}+ via Vantage
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 mb-6">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
            What happens next
          </p>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-zinc-600 text-xs mt-0.5 shrink-0">
                  {i + 1}.
                </span>
                <p className="text-sm text-zinc-300 leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-zinc-600 text-center mb-4 leading-relaxed">
          Access is activated on deposit confirmation. Past performance does not
          guarantee future results. Trading involves risk.
        </p>

        {error ? (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onYes()}
            className={`w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} text-black ${t.accentBgHover} transition-colors disabled:opacity-50`}
          >
            {busy ? "…" : "Yes — activate my access path"}
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
