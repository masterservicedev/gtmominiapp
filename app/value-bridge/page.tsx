"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getAccentPalette } from "@/lib/funnel/palette";
import { trackFunnelEvent } from "@/lib/funnel/track";
import type { Capital, Readiness } from "@/lib/scoring";
import type { FunnelAccentPalette } from "@/lib/funnel/types";

type ProofContent = {
  statLine: string;
  moPosts: readonly { quote: string }[];
  memberReactions: readonly { quote: string }[];
};

/** Tier-tuned channel proof — starter leans member/setup; higher tiers show session results. */
const PROOF_BY_CAPITAL: Record<Capital, ProofContent> = {
  under_100: {
    statLine:
      "Live sessions run every day in the channel — here is the community and guidance you step into when you fund your account.",
    moPosts: [
      {
        quote:
          "Every session is called in real time — setup, entries, and risk explained as markets move.",
      },
      {
        quote:
          "3 TPs for the free channel and 6 for VIP today — shared live so you see how execution works 💰",
      },
    ],
    memberReactions: [
      { quote: "I'm up 15% today. Thanks Golden Mo 🙏" },
      {
        quote:
          "Really glad I joined — the structure finally made sense for my account ✅",
      },
    ],
  },
  "100_300": {
    statLine:
      "23 of 24 take profits hit last week, all shared live — here is what the inside looks like on a normal day.",
    moPosts: [
      {
        quote:
          "$36,600+ closed today. 3 TPs for the free channel, 6 TPs for VIP today 💰",
      },
      {
        quote:
          "$18,000+ closed quickly — one trade, sniped profits, done 💪",
      },
    ],
    memberReactions: [
      { quote: "113 → 231 because of VIP. Really glad I joined, Mo ✅" },
      { quote: "10% today 😂 Mo you're like dynamite 🧨" },
    ],
  },
  "300_1000": {
    statLine:
      "1,150+ pips called live in community sessions last week — here is what that looks like inside the channel.",
    moPosts: [
      {
        quote:
          "$27,000 up trading gold today. Probably one of the strongest days this year.",
      },
      {
        quote:
          "Team VIP continues printing — TP1 ✅ TP2 ✅✅ — breakeven set for zero risk.",
      },
    ],
    memberReactions: [
      { quote: "I'm up 15% today. Thanks Golden Mo 🙏" },
      { quote: "216 on the day — such a good day again, perfect Mo 🙏" },
    ],
  },
  "1000_plus": {
    statLine:
      "$35,000+ managed live during a single NFP week — here is what full access looks like inside.",
    moPosts: [
      {
        quote:
          "$36,600+ closed today. 3 TPs for the free channel, 6 TPs for VIP today 💰",
      },
      {
        quote:
          "$27,000 up trading gold today. Probably one of the strongest days this year.",
      },
    ],
    memberReactions: [
      { quote: "113 → 231 because of VIP. Really glad I joined, Mo ✅" },
      {
        quote:
          "I can boldly move forward — blessed to come across you Mo 🙏",
      },
    ],
  },
};

const FRAMING_BY_CAPITAL: Record<Capital, string> = {
  under_100:
    "When you fund your account with $50, you stop learning alone and start with structure, guidance, and a community behind you.",
  "100_300":
    "When you fund your account with $100, you step inside the live environment where those results above are called every day.",
  "300_1000":
    "When you fund your account with $200, you join the environment where every session is called live — not reported after.",
  "1000_plus":
    "When you fund your account with $500, you get full access to the environment and community that produced what you just read.",
};

const CTA_BY_CAPITAL: Record<Capital, string> = {
  under_100: "Start my setup →",
  "100_300": "Activate VIP access →",
  "300_1000": "Activate FX Basics access →",
  "1000_plus": "Activate School access →",
};

type ReadinessGroup = "soon" | "this_month" | "generic";

type OpeningCopy = {
  eyebrow: string;
  headline: string;
  sub: string;
};

const OPENING_BY_CAPITAL: Record<
  Capital,
  Record<ReadinessGroup, OpeningCopy>
> = {
  under_100: {
    soon: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline:
        "You have under $100 and you are ready to start. That is exactly where structure matters most.",
      sub: "Before you risk capital on live markets, the right setup changes everything.",
    },
    this_month: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline:
        "You have under $100 and you are planning to start this month.",
      sub: "The right setup before you fund is what separates traders who last from those who don't.",
    },
    generic: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline: "You are at the right starting point.",
      sub: "Before you risk capital on live markets, the right setup changes everything.",
    },
  },
  "100_300": {
    soon: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline:
        "You have $100–$300 and you are ready to move. Small capital managed with structure outperforms large capital managed without it.",
      sub: "Here is why VIP access is the right starting point for where you are now.",
    },
    this_month: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline:
        "You have $100–$300 and you are planning to start this month.",
      sub: "The structure you build now determines what your account looks like in 90 days.",
    },
    generic: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline: "You are starting seriously.",
      sub: "Here is why VIP access is the right starting point for where you are now.",
    },
  },
  "300_1000": {
    soon: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline:
        "You have $300–$1,000 and you are ready now. At this level, structure matters more than size.",
      sub: "Here is what traders at your capital level get wrong — and how FX Basics changes that.",
    },
    this_month: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline: "You have $300–$1,000 and you are almost ready.",
      sub: "Traders at this level have enough confidence to take positions but not enough structure to manage them. That is what changes next.",
    },
    generic: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline: "You have enough capital to trade seriously.",
      sub: "Here is what traders at your capital level get wrong — and how FX Basics changes that.",
    },
  },
  "1000_plus": {
    soon: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline:
        "You have $1,000+ and you are ready to operate at full access.",
      sub: "The capital is there. The infrastructure to use it with structure is what activates next.",
    },
    this_month: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline: "You have $1,000+ and you are planning your next move.",
      sub: "Most traders at this level have capital but trade in isolation. School access changes that.",
    },
    generic: {
      eyebrow: "BASED ON YOUR ANSWERS",
      headline: "You are ready to operate at full access.",
      sub: "The capital is there. The infrastructure to use it with structure is what activates next.",
    },
  },
};

function isReadiness(raw: string | null): raw is Readiness {
  return (
    raw === "ready_now" ||
    raw === "seven_days" ||
    raw === "this_month" ||
    raw === "not_ready"
  );
}

function readinessGroup(raw: Readiness): ReadinessGroup {
  if (raw === "ready_now" || raw === "seven_days") return "soon";
  if (raw === "this_month") return "this_month";
  return "soon";
}

function getPersonalisedOpening(
  capital: Capital,
  readinessRaw: string | null,
): OpeningCopy {
  if (!readinessRaw || !isReadiness(readinessRaw)) {
    return OPENING_BY_CAPITAL[capital].generic;
  }
  return OPENING_BY_CAPITAL[capital][readinessGroup(readinessRaw)];
}

function memberFirstCapital(capital: Capital): boolean {
  return capital === "under_100" || capital === "100_300";
}

function ChannelQuoteCard({
  quote,
  attribution,
  variant,
  palette,
}: {
  quote: string;
  attribution: string;
  variant: "mo" | "member";
  palette: FunnelAccentPalette;
}) {
  const isMo = variant === "mo";
  return (
    <div
      className={`rounded-xl border border-zinc-800/80 p-3.5 ${
        isMo
          ? `border-l-2 ${palette.accentBorder} bg-zinc-950/80`
          : "border-l-2 border-zinc-700/80 bg-zinc-900/50"
      }`}
    >
      <p
        className={`text-sm leading-snug ${isMo ? "text-zinc-50" : "text-zinc-300"}`}
      >
        {quote}
      </p>
      <p className="mt-2 text-[10px] text-zinc-500">{attribution}</p>
    </div>
  );
}

function LiveChannelProofSection({
  capital,
  palette,
  framingSentence,
}: {
  capital: Capital;
  palette: FunnelAccentPalette;
  framingSentence: string;
}) {
  const proof = PROOF_BY_CAPITAL[capital];
  const membersFirst = memberFirstCapital(capital);

  const interleaved = membersFirst
    ? [
        { ...proof.memberReactions[0]!, variant: "member" as const },
        { ...proof.moPosts[0]!, variant: "mo" as const },
        { ...proof.memberReactions[1]!, variant: "member" as const },
        { ...proof.moPosts[1]!, variant: "mo" as const },
      ]
    : proof.moPosts.flatMap((post, i) => [
        { ...post, variant: "mo" as const },
        { ...proof.memberReactions[i]!, variant: "member" as const },
      ]);

  const moColumn = (
    <div className="space-y-2">
      {proof.moPosts.map((post, i) => (
        <ChannelQuoteCard
          key={`mo-${i}`}
          quote={post.quote}
          attribution="Mo — live session"
          variant="mo"
          palette={palette}
        />
      ))}
    </div>
  );

  const memberColumn = (
    <div className="space-y-2">
      {proof.memberReactions.map((reaction, i) => (
        <ChannelQuoteCard
          key={`member-${i}`}
          quote={reaction.quote}
          attribution="Community member"
          variant="member"
          palette={palette}
        />
      ))}
    </div>
  );

  return (
    <section className="mb-5" aria-labelledby="live-channel-proof-heading">
      <p
        id="live-channel-proof-heading"
        className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500"
      >
        Live from the channel
      </p>
      <p
        className={`mb-4 text-sm font-medium leading-snug ${palette.bridgeHeadline}`}
      >
        {proof.statLine}
      </p>
      <p className="mb-4 text-sm leading-relaxed text-zinc-500">
        This is what the inside looks like on a normal trading day.
      </p>

      <div className="mb-4 hidden gap-3 sm:grid sm:grid-cols-2">
        {membersFirst ? (
          <>
            {memberColumn}
            {moColumn}
          </>
        ) : (
          <>
            {moColumn}
            {memberColumn}
          </>
        )}
      </div>

      <div className="mb-4 space-y-2 sm:hidden">
        {interleaved.map((item, i) => (
          <ChannelQuoteCard
            key={`mobile-${i}`}
            quote={item.quote}
            attribution={
              item.variant === "mo" ? "Mo — live session" : "Community member"
            }
            variant={item.variant}
            palette={palette}
          />
        ))}
      </div>

      <p className="text-center text-sm font-medium leading-relaxed text-zinc-300 sm:text-[0.9375rem]">
        {framingSentence}
      </p>
    </section>
  );
}

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
  whatGoesWrong: { heading: string; body: string };
  howAccessHelps: { heading: string; body: string };
};

const tierContent: Record<Capital, TierContent> = {
  under_100: {
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Most people with under $100 jump into live markets before they know how to set up MT5, size positions, or follow a signal framework. They lose what they have and exit — not because the opportunity was wrong, but because the setup was missing.",
    },
    howAccessHelps: {
      heading: "How starter access changes that",
      body: "The MT5 Guide and GTMO Ebook give you practical setup and the signal framework behind how GTMO trades — so you start with clarity before you scale capital, inside a live community not a solo course.",
    },
  },

  "100_300": {
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Traders at this level often follow signals without understanding entries, stops, or position sizing. One bad sequence wipes the account — not because the signals were wrong, but because the execution framework was missing.",
    },
    howAccessHelps: {
      heading: "How your access changes that",
      body: "VIP puts you inside the environment where entries are explained in real time. You see reasoning, risk management, and exits as they happen — the difference between following blindly and building a repeatable approach with the community.",
    },
  },

  "300_1000": {
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Traders with $300–$1,000 often take positions without structure under pressure — small mistakes compound until the account erodes, not from one disaster but from inconsistent execution.",
    },
    howAccessHelps: {
      heading: "How your access changes that",
      body: "FX Basics gives you structured Forex curriculum with ongoing live context from the GTMO trader as markets move — habits and community at your capital level, not isolated learning.",
    },
  },

  "1000_plus": {
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Traders with $1,000+ often have capital but trade in isolation — fragmented information, no live context, no community. The capital is there; the system is not.",
    },
    howAccessHelps: {
      heading: "How your access changes that",
      body: "Full School access surrounds your capital with video courses, live sessions with real positions, exclusive strategies, and 10,000+ traders in the same environment — merit-built, not shortcuts.",
    },
  },
};

const BRIDGE_DELAY_MS = 600;

function ValueBridgeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [revealing, setRevealing] = useState(false);

  const variant = normalizeEntryVariant(params.get("variant")) as AdVariant;
  const cfg = getFunnelConfig(variant);
  const palette = getAccentPalette(cfg);
  const t = palette;
  const preSteps = getPreQuestionnaireSteps();
  const totalFunnelSteps = preSteps + 7;
  const progressStep = preSteps + 6;

  const capitalRaw = params.get("capital");
  const capital = isCapital(capitalRaw) ? capitalRaw : null;
  const readiness = params.get("readiness");
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

  const opening = getPersonalisedOpening(capital, readiness);
  const ctaLabel = CTA_BY_CAPITAL[capital];

  const shell = (children: ReactNode) => (
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
      {children}
    </div>
  );

  return shell(
    <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-8 sm:px-8">
      <div className="mb-6">
        <p
          className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] ${palette.valueBridgeEyebrow}`}
        >
          {opening.eyebrow}
        </p>
        <h1 className="mb-3 font-serif text-2xl font-normal leading-snug tracking-tight text-zinc-50 md:text-[1.75rem]">
          {opening.headline}
        </h1>
        <p className={`text-sm font-medium leading-snug ${palette.bridgeHeadline}`}>
          {opening.sub}
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

      <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
        <p className="mb-3 text-[10px] text-zinc-500 uppercase tracking-widest">
          {content.howAccessHelps.heading}
        </p>
        <p className="text-sm leading-relaxed text-zinc-300">
          {content.howAccessHelps.body}
        </p>
      </div>

      <LiveChannelProofSection
        capital={capital}
        palette={palette}
        framingSentence={FRAMING_BY_CAPITAL[capital]}
      />

      <button
        type="button"
        onClick={handleContinue}
        disabled={revealing}
        className={`mt-auto w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} ${t.accentButtonText} ${t.accentBgHover} transition-colors disabled:opacity-70`}
      >
        {revealing ? "Loading…" : ctaLabel}
      </button>

      <p className="mt-3 text-center text-[10px] leading-relaxed text-zinc-600">
        Posts are from a live channel environment. Past results are not typical
        and do not guarantee your outcomes. Trading involves risk.
      </p>
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
