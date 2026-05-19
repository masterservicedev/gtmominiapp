"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { normalizeEntryVariant, type AdVariant } from "@/lib/funnel/normalize";
import { getFunnelConfig, getPreQuestionnaireSteps } from "@/lib/funnel/resolve";
import { getAccentPalette } from "@/lib/funnel/palette";
import { trackFunnelEvent } from "@/lib/funnel/track";
import type { Capital } from "@/lib/scoring";
import type { FunnelAccentPalette } from "@/lib/funnel/types";

const MO_SESSION_POSTS = [
  {
    quote:
      "$36,600+ closed today. 3 TPs for the free channel, 6 TPs for VIP today 💰",
  },
  {
    quote:
      "$27,000 up trading gold today. Probably one of the strongest days this year.",
  },
  {
    quote: "$18,000+ closed quickly — one trade, sniped profits, done 💪",
  },
] as const;

const MEMBER_REACTIONS = [
  { quote: "I'm up 15% today. Thanks Golden Mo 🙏" },
  { quote: "113 → 231 because of VIP. Really glad I joined, Mo ✅" },
  { quote: "10% today 😂 Mo you're like dynamite 🧨" },
] as const;

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

function LiveChannelProofSection({ palette }: { palette: FunnelAccentPalette }) {
  const interleaved = MO_SESSION_POSTS.flatMap((post, i) => [
    { ...post, variant: "mo" as const },
    { ...MEMBER_REACTIONS[i]!, variant: "member" as const },
  ]);

  return (
    <section className="mb-4" aria-labelledby="live-channel-proof-heading">
      <p
        id="live-channel-proof-heading"
        className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500"
      >
        Live from the channel
      </p>
      <p className="mb-4 text-sm leading-relaxed text-zinc-500">
        This is what the inside looks like on a normal trading day.
      </p>

      <div className="mb-4 hidden gap-3 sm:grid sm:grid-cols-2">
        <div className="space-y-2">
          {MO_SESSION_POSTS.map((post, i) => (
            <ChannelQuoteCard
              key={`mo-${i}`}
              quote={post.quote}
              attribution="Mo — live session"
              variant="mo"
              palette={palette}
            />
          ))}
        </div>
        <div className="space-y-2">
          {MEMBER_REACTIONS.map((reaction, i) => (
            <ChannelQuoteCard
              key={`member-${i}`}
              quote={reaction.quote}
              attribution="Community member"
              variant="member"
              palette={palette}
            />
          ))}
        </div>
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
        This is not a course you watch alone.
        <br className="hidden sm:inline" /> This is a live environment — every
        session called in real time, every result shared as it happens.
        <br className="hidden sm:inline" /> When you fund your trading account,
        you step inside this.
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
    qualifyHeadline: "Start with the right setup before risking more capital.",
    qualifySub:
      "You do not need a large account to begin properly — you need structure first.",
    whatGoesWrong: {
      heading: "What usually goes wrong at this stage",
      body: "Most people with under $100 jump into live markets before they know how to set up MT5, size positions, or follow a signal framework. They lose what they have, get frustrated, and exit — not because the opportunity was wrong, but because the setup was missing.",
    },
    howAccessHelps: {
      heading: "How starter access changes that",
      body: "The MT5 Guide walks you through practical setup and execution — personally written by MO. The GTMO Ebook gives you the signal framework and mindset behind how GTMO trades. Together they help you start with clarity before you scale capital.",
    },
    processProof: [
      { value: "MT5", label: "Guide — practical setup and execution by MO" },
      { value: "56", label: "pages in the GTMO Ebook — signal framework" },
      { value: "$50", label: "minimum funding activates starter access" },
    ],
    activatesAfterFunding: [
      "MT5 Guide — practical MT5 setup and execution, personally written by MO",
      "GTMO Ebook — strategy, mindset, and signal framework",
      "Activation after your account is funded and verified via your registration link",
    ],
    miniAppBonus:
      "Because you applied through the mini app, MT5 Guide and the GTMO Ebook are included together when you fund your account with $50+.",
    transition: "Here is your starter activation path.",
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
      "Because you applied through the mini app, the MT5 Guide is included with your VIP access at no extra cost.",
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
      body: "FX Basics gives you a structured Forex curriculum with ongoing channel-style delivery. You follow live context from the GTMO trader as markets move and build the habits serious trading requires.",
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
      "FX Basics — complete Forex curriculum with ongoing GTMO support",
      "Structured coverage of market structure, setups, and execution discipline",
      "Ongoing live context from the GTMO trader as markets move",
      "Community support from traders operating at your capital level",
    ],
    miniAppBonus:
      "Because you applied through the mini app, the GTMO Ebook is included with your FX Basics access at no extra cost.",
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
      "Exclusive strategies from the GTMO himself!",
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
  const palette = getAccentPalette(cfg);
  const t = palette;
  const preSteps = getPreQuestionnaireSteps();
  const totalFunnelSteps = preSteps + 7;
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
      <div className="mb-7">
        <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] ${palette.valueBridgeEyebrow}`}>
          Your access path
        </p>
        <h1 className="mb-3 font-serif text-2xl font-normal leading-snug tracking-tight text-zinc-50 md:text-[1.75rem]">
          {content.qualifyHeadline}
        </h1>
        <p className={`text-sm font-medium leading-snug ${palette.bridgeHeadline}`}>
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

      <LiveChannelProofSection palette={palette} />

      {content.activatesAfterFunding.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
          <p className="mb-4 text-[10px] text-zinc-500 uppercase tracking-widest">
            What activates after your account is funded
          </p>
          <div className="space-y-2">
            {content.activatesAfterFunding.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`mt-0.5 shrink-0 text-xs ${palette.bridgeCheckmark}`}>
                  ✓
                </span>
                <p className="text-sm leading-snug text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {content.miniAppBonus ? (
        <div
          className={`mb-6 rounded-2xl border ${palette.bonusPanelBorder} ${palette.bonusPanelBg} p-5`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className={`text-sm ${palette.bonusPanelAccent}`} aria-hidden>
              🎁
            </span>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${palette.bonusPanelAccent}`}
            >
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
        className={`mt-auto w-full rounded-xl py-4 text-sm font-semibold ${t.accentBg} ${t.accentButtonText} ${t.accentBgHover} transition-colors disabled:opacity-70`}
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
