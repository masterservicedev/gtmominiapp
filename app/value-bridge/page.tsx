"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getThemeClasses } from "@/lib/funnel/theme";
import { trackFunnelEvent } from "@/lib/funnel/track";
import type { Capital } from "@/lib/scoring";

const channelLink = process.env.NEXT_PUBLIC_CHANNEL_LINK || "#";

const CAPITALS: Capital[] = [
  "under_100",
  "100_300",
  "300_1000",
  "1000_plus",
];

function isCapital(raw: string | null): raw is Capital {
  return raw !== null && CAPITALS.includes(raw as Capital);
}

type TierContent = {
  qualifyHeadline: string;
  qualifySub: string;
  whatGoesWrong: { heading: string; body: string };
  howAccessHelps: { heading: string; body: string };
  processProof: { value: string; label: string }[];
  activatesAfterFunding: string[];
  miniAppBonus: string | null;
  transition: string;
};

const tierContent: Record<Capital, TierContent> = {
  under_100: {
    qualifyHeadline: "You are at the start of this journey.",
    qualifySub:
      "That is not a barrier. It is where every serious trader begins.",
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Most people with under $100 try to trade their way to a bigger account before they understand the basics. They lose what they have, get frustrated, and exit the market entirely. The capital is not the problem. The approach is.",
    },
    howAccessHelps: {
      heading: "What the channel gives you instead",
      body: "The free GTMO signals channel is live every day. You can follow real entries, exits, and risk management in real time — without risking a single dollar — until you understand the structure and are ready to act on it properly.",
    },
    processProof: [
      { value: "Daily", label: "live sessions in the free channel" },
      {
        value: "Real",
        label: "entries, exits and stops shown every time",
      },
      { value: "Free", label: "channel access while you build readiness" },
    ],
    activatesAfterFunding: [],
    miniAppBonus: null,
    transition:
      "Join the channel. Watch the process. Come back when you are ready to activate.",
  },

  "100_300": {
    qualifyHeadline: "You are starting seriously.",
    qualifySub:
      "Small capital managed with structure outperforms large capital managed without it.",
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Traders at this level often follow signals without understanding why an entry was taken, where the stop logic came from, or how to size a position correctly for their account. One bad trade sequence wipes the account — not because the signals were wrong, but because the execution framework was missing.",
    },
    howAccessHelps: {
      heading: "How your access changes that",
      body: "VIP access puts you inside the environment where entries are explained in real time, not just posted. You see the reasoning, the risk management, and the exits as they happen. That is the difference between following blindly and building a repeatable approach.",
    },
    processProof: [
      {
        value: "23/24",
        label:
          "take profits hit last week — all shared live with entries, exits, and risk management in real time",
      },
      {
        value: "Daily",
        label: "live sessions — entries called before execution, not after",
      },
      {
        value: "10,000+",
        label: "traders in the community following the same setups",
      },
    ],
    activatesAfterFunding: [
      "VIP signals channel — Gold, Crypto, and FX daily",
      "Live trade explanations with entry, exit and stop logic shown in real time",
      "Direct access to the affiliated broker with deposit bonuses",
      "Community of active traders at your level",
    ],
    miniAppBonus:
      "Because you applied through the mini app, the GTMO Ebook — 56 pages of signal strategy — is included with your VIP access at no extra cost.",
    transition: "Here is your recommended access path.",
  },

  "300_1000": {
    qualifyHeadline: "You have enough capital to trade seriously.",
    qualifySub: "At this level, structure matters more than size.",
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Traders with $300–$1,000 often have enough confidence to take positions but not enough structure to manage them under pressure. They understand the basics but misread entries, overtrade during volatility, or ignore risk management when a trade moves against them. The account erodes slowly — not from one disaster, but from consistent small mistakes that compound.",
    },
    howAccessHelps: {
      heading: "How your access changes that",
      body: "The education path we activate at this level is designed specifically for traders who are past beginner stage but need a framework. You follow a live trader who explains every move in real time, and access structured learning that builds the habits serious trading requires.",
    },
    processProof: [
      {
        value: "1,150+",
        label: "pips called live in community sessions in a single week",
      },
      {
        value: "Real-time",
        label:
          "trade breakdowns — entry, exit, and risk explained before execution",
      },
      {
        value: "Live",
        label: "chart views and analysis not shared publicly",
      },
    ],
    activatesAfterFunding: [
      "FX Basics or Education channel — your specialist confirms which fits your level",
      "Structured curriculum covering market structure, setups, and execution discipline",
      "Ongoing live context from the GTMO trader as markets move",
      "Community support from traders operating at your capital level",
    ],
    miniAppBonus:
      "Because you applied through the mini app, you can add a second product at 50% off when you speak with your specialist. Your specialist confirms which primary product fits your level first.",
    transition: "Here is your recommended access path.",
  },

  "1000_plus": {
    qualifyHeadline: "You are ready to operate at full access.",
    qualifySub:
      "The infrastructure to do it with structure is what activates next.",
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Traders with $1,000+ available often have the capital to take meaningful positions but enter the market without surrounding infrastructure — no structured education, no live context, no community. They trade in isolation, rely on fragmented information, and make decisions without a repeatable framework. The capital is there. The system is not.",
    },
    howAccessHelps: {
      heading: "How your access changes that",
      body: "Full GTMO access surrounds your capital with everything a serious trader needs — structured video courses, live sessions where real positions are opened and managed in real time, exclusive strategies, and a community of 10,000+ traders operating in the same environment.",
    },
    processProof: [
      {
        value: "$35,000+",
        label:
          "secured in community sessions during a single NFP event — managed live with full risk transparency",
      },
      {
        value: "1,150+",
        label: "pips called live in a single trading week",
      },
      {
        value: "100%",
        label: "live — every session, every signal, every day",
      },
    ],
    activatesAfterFunding: [
      "Full GTMO School — all video courses, beginner to advanced",
      "Exclusive chart views and technical analysis not published publicly",
      "Live trading sessions — positions opened and managed in real time",
      "Exclusive strategies developed and tested by the channel trader",
      "Member pricing on all future GTMO products and events",
    ],
    miniAppBonus:
      "Because you applied through the mini app, one additional product of your choice is included with your School access — completely free. Confirmed with your specialist after funding.",
    transition: "Here is your full access path.",
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
  const preSteps = getPreQuestionnaireSteps();
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
    if (!capital || capital === "under_100") return;
    setRevealing(true);
    window.setTimeout(() => {
      router.push(`/product-match?variant=${encodeURIComponent(variant)}`);
    }, BRIDGE_DELAY_MS);
  }

  if (!capital || !content) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

  const shell = (children: ReactNode) => (
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
      {children}
    </div>
  );

  if (capital === "under_100") {
    return shell(
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-8 sm:px-8">
        <div className="mb-7">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-500/90">
            Your path
          </p>
          <h1 className="mb-3 font-serif text-2xl font-normal leading-snug tracking-tight text-zinc-50 md:text-[1.75rem]">
            {content.qualifyHeadline}
          </h1>
          <p className="text-sm font-medium leading-snug text-emerald-400/95">
            {content.qualifySub}
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5">
          <p className="mb-3 text-[10px] text-zinc-500 uppercase tracking-widest">
            {content.whatGoesWrong.heading}
          </p>
          <p className="text-sm leading-relaxed text-zinc-300">
            {content.whatGoesWrong.body}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
          <p className="mb-3 text-[10px] text-zinc-500 uppercase tracking-widest">
            {content.howAccessHelps.heading}
          </p>
          <p className="text-sm leading-relaxed text-zinc-300">
            {content.howAccessHelps.body}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-3">
          {content.processProof.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-center"
            >
              <p className="text-base font-bold leading-tight text-zinc-50">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] leading-tight text-zinc-500 sm:text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mb-6 text-center text-sm leading-relaxed text-zinc-500">
          {content.transition}
        </p>

        <p className="mb-4 text-center text-[10px] leading-relaxed text-zinc-600">
          Figures and examples refer to community-reported outcomes and are not
          guarantees of your results. Trading involves risk.
        </p>

        <a
          href={channelLink}
          className="mt-auto block w-full rounded-xl bg-white py-4 text-center text-sm font-semibold text-black transition-colors hover:bg-zinc-100"
        >
          Join the free channel →
        </a>
      </div>,
    );
  }

  return shell(
    <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-8 sm:px-8">
      <div className="mb-7">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-500/90">
          Your access path
        </p>
        <h1 className="mb-3 font-serif text-2xl font-normal leading-snug tracking-tight text-zinc-50 md:text-[1.75rem]">
          {content.qualifyHeadline}
        </h1>
        <p className="text-sm font-medium leading-snug text-emerald-400/95">
          {content.qualifySub}
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5">
        <p className="mb-3 text-[10px] text-zinc-500 uppercase tracking-widest">
          {content.whatGoesWrong.heading}
        </p>
        <p className="text-sm leading-relaxed text-zinc-300">
          {content.whatGoesWrong.body}
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
        <p className="mb-3 text-[10px] text-zinc-500 uppercase tracking-widest">
          {content.howAccessHelps.heading}
        </p>
        <p className="text-sm leading-relaxed text-zinc-300">
          {content.howAccessHelps.body}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {content.processProof.map((stat, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-center"
          >
            <p className="text-base font-bold leading-tight text-zinc-50 sm:text-lg">
              {stat.value}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-zinc-500 sm:text-xs">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {content.activatesAfterFunding.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
          <p className="mb-4 text-[10px] text-zinc-500 uppercase tracking-widest">
            What activates after your account is funded
          </p>
          <div className="space-y-2">
            {content.activatesAfterFunding.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-xs text-emerald-500">
                  ✓
                </span>
                <p className="text-sm leading-snug text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {content.miniAppBonus ? (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-amber-400" aria-hidden>
              🎁
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Mini app activation bonus
            </p>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">
            {content.miniAppBonus}
          </p>
        </div>
      ) : null}

      <p className="mb-6 text-center text-sm leading-relaxed text-zinc-500">
        {content.transition}
      </p>

      <p className="mb-4 text-center text-[10px] leading-relaxed text-zinc-600">
        Figures and examples refer to community-reported outcomes and are not
        guarantees of your results. Trading involves risk.
      </p>

      <button
        type="button"
        onClick={handleContinue}
        disabled={revealing}
        className={`mt-auto w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} text-black ${t.accentBgHover} transition-colors disabled:opacity-70`}
      >
        {revealing
          ? "Loading your access path…"
          : "Continue to activation →"}
      </button>
    </div>,
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
