"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { trackFunnelEvent } from "@/lib/funnel/track";
import type { Capital } from "@/lib/scoring";

const CAPITALS: Capital[] = [
  "under_100",
  "100_300",
  "300_1000",
  "1000_plus",
];

function isCapital(raw: string | null): raw is Capital {
  return raw !== null && CAPITALS.includes(raw as Capital);
}

const tierContent: Record<
  Capital,
  {
    headline: string;
    subheadline: string;
    context: string;
    stats: { value: string; label: string }[];
    valuePoints: string[];
    transition: string;
  }
> = {
  under_100: {
    headline: "Every serious trader started exactly where you are.",
    subheadline: "The difference is what they had access to.",
    context:
      "Starting with under $100 is not a limitation — it is a decision to build correctly from the beginning. The traders inside this community who now generate consistent returns did not start with large capital. They started with the right structure.",
    stats: [
      { value: "10,000+", label: "active traders in the community" },
      { value: "1,150+", label: "pips delivered in a single week" },
      { value: "23/24", label: "take profits hit last week" },
    ],
    valuePoints: [
      "Access to a trader who executes live every single day — not pre-recorded theory",
      "Signals with full context: entry, exit, stop loss, and the reasoning behind each call",
      "A community where traders at every level share the same setups in real time",
      "The foundational knowledge to understand what you are trading and why",
    ],
    transition: "Here is what your access unlocks.",
  },

  "100_300": {
    headline: "You are not just funding an account. You are joining an operation.",
    subheadline: "This is what $100 actually buys you access to.",
    context:
      "The traders generating consistent results inside this community are not doing it alone. They follow a live trader who manages real positions every day, calls entries in real time, and has built a track record across Gold, Crypto, and FX. Your deposit is the key that opens that environment.",
    stats: [
      { value: "$35,000+", label: "secured on a single NFP setup" },
      { value: "10,000+", label: "traders following the same signals" },
      { value: "Daily", label: "live sessions — not weekly, not monthly" },
    ],
    valuePoints: [
      "Daily signals across Gold (XAU/USD), Crypto, and major FX pairs — not just one market",
      "Live position management — watch stops move, partials close, risk get managed in real time",
      "Direct access to the affiliated broker with deposit bonuses not available publicly",
      "A 56-page strategy guide written by the trader himself — not an outsourced PDF",
    ],
    transition: "Here is exactly what you unlock at your level.",
  },

  "300_1000": {
    headline:
      "You have the capital to trade properly. Now get the structure to do it consistently.",
    subheadline: "Most traders at your level fail because of knowledge gaps, not money.",
    context:
      "Having $300 to $1,000 available means you can trade real size and see real results. What separates the traders who compound at this level from those who give it back is understanding. Not luck. Not more capital. Understanding market structure, timing, and how to execute the setups being called — correctly.",
    stats: [
      { value: "230+", label: "pips on a single NFP day" },
      { value: "56 pages", label: "of documented strategy and signal methodology" },
      { value: "Live", label: "chart views and analysis not shared publicly" },
    ],
    valuePoints: [
      "Structured curriculum that explains the why behind every signal call",
      "Live trading sessions that show execution, not just entry points",
      "Access to exclusive strategies developed and refined over years of live trading",
      "A community of traders at your level sharing results, questions, and context daily",
      "The broker infrastructure to act on signals with the right conditions and bonuses",
    ],
    transition:
      "Here is what your level unlocks — including your exclusive bundle.",
  },

  "1000_plus": {
    headline: "You are ready to operate at a level most traders never reach.",
    subheadline:
      "The infrastructure to do it consistently is what you are about to unlock.",
    context:
      "With $1,000 or more ready to deploy, you are in the position most traders spend years trying to reach. The question at this level is not whether you can trade — it is whether you have the right information, the right signals, and the right community around you when you do. That is exactly what this environment is built to provide.",
    stats: [
      { value: "$35,000+", label: "secured by the community in a single session" },
      { value: "1,150+", label: "pips delivered in one trading week" },
      { value: "100%", label: "live — every session, every signal, every day" },
    ],
    valuePoints: [
      "The complete GTMO trading curriculum — every course, every strategy, every chart view",
      "Live sessions where you watch real positions being opened and managed, not simulated",
      "Exclusive strategies not available in the free channel or any public resource",
      "The full community infrastructure — 10,000+ traders, daily analysis, broker access",
      "Member pricing on all future GTMO products and events",
      "One additional product of your choice — free, as a mini app member",
    ],
    transition: "Here is the full breakdown of what you are getting.",
  },
};

const BRIDGE_DELAY_MS = 600;

function ValueBridgeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [revealing, setRevealing] = useState(false);

  const variant = normalizeEntryVariant(params.get("variant")) as AdVariant;
  const cfg = getFunnelConfig(variant);
  const t = getThemeClasses(cfg.theme);
  const preSteps = getPreQuestionnaireSteps(variant);
  const totalFunnelSteps = preSteps + 8;
  const progressStep = preSteps + 6;

  const capitalRaw = params.get("capital");
  const capital = isCapital(capitalRaw) ? capitalRaw : null;
  const content = capital ? tierContent[capital] : null;

  useEffect(() => {
    if (capital) {
      void trackFunnelEvent("value_bridge_view", { variant, capital });
    }
  }, [variant, capital]);

  useEffect(() => {
    if (!capital || !content) {
      router.replace(
        `/product-match?variant=${encodeURIComponent(variant)}`,
      );
    }
  }, [capital, content, router, variant]);

  function handleContinue() {
    if (!capital) return;
    setRevealing(true);
    window.setTimeout(() => {
      router.push(
        `/product-match?variant=${encodeURIComponent(variant)}`,
      );
    }, BRIDGE_DELAY_MS);
  }

  if (!capital || !content) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

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
          Before we show you your access
        </p>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-zinc-50 mb-3">
          {content.headline}
        </h1>
        <p className="text-base text-emerald-400/95 font-medium leading-snug mb-6">
          {content.subheadline}
        </p>

        <p className="text-sm text-zinc-300 leading-relaxed mb-7">
          {content.context}
        </p>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-7">
          {content.stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-center"
            >
              <p className="text-base sm:text-lg font-bold text-zinc-50 leading-tight">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 leading-tight">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 mb-7">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">
            What you are joining
          </p>
          <div className="space-y-3">
            {content.valuePoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-sm shrink-0">
                  ✓
                </span>
                <p className="text-sm text-zinc-300 leading-snug">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-zinc-500 text-center mb-6 leading-relaxed">
          {content.transition}
        </p>

        <p className="text-[10px] text-zinc-600 text-center mb-4 leading-relaxed">
          Figures and examples refer to community-reported outcomes and are not
          guarantees of your results. Trading involves risk.
        </p>

        <button
          type="button"
          onClick={handleContinue}
          disabled={revealing}
          className={`mt-auto w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} text-black ${t.accentBgHover} transition-colors disabled:opacity-70`}
        >
          {revealing ? "Loading your access…" : "Show me what I unlock →"}
        </button>
      </div>
    </div>
  );
}

export default function ValueBridgePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">
          Loading…
        </div>
      }
    >
      <ValueBridgeInner />
    </Suspense>
  );
}
