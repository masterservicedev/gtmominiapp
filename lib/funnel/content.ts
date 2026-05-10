import type { FunnelVariantConfig } from "./types";
import type { AdVariant } from "./normalize";
import { ad4VariantConfig } from "./content-ad4";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL || ""
    : "";

export const funnelContent: Record<AdVariant, FunnelVariantConfig> = {
  ad1: {
    theme: "amber",
    positioningGate: {
      headline: "This is for traders ready to execute — not spectators.",
      subcopy:
        "If you want passive entertainment, this is not the right place. If you are serious about structure, risk, and funding an account, continue.",
      ctaLabel: "Continue",
    },
    socialProofTicker: [
      "Live setups posted in the free channel daily",
      "Education-first community — no guaranteed returns",
      "Join traders who prefer process over hype",
    ],
    offer: {
      mode: "video",
      heroTitle: "Ride the momentum of gold trading",
      heroSub:
        "See how we approach markets with structure — then apply if it fits your goals.",
      video: {
        src: VIDEO_SRC,
        minWatchSeconds: 15,
      },
      authority: {
        title: "Meet Gold Trader Mo",
        body: [
          "I built tools and processes around gold and risk management — not hype.",
          "Watch the short brief above, then complete a quick application so we can match you with the right path.",
        ],
      },
      supportingCopy: [
        "The GTMO community focuses on live market context and disciplined execution.",
      ],
      riskShort:
        "Trading involves risk. Past performance does not guarantee future results. Only risk capital you can afford to lose.",
      riskLinkUrl: undefined,
      ctaLabel: "Continue to application",
    },
  },
  ad2: {
    theme: "amber",
    positioningGate: {
      headline: "Quick filter before we show you the brief.",
      subcopy:
        "We work with people who can follow a plan and fund responsibly. Tap continue only if that is you.",
      ctaLabel: "Continue",
    },
    prelander: {
      headline: "See if you qualify for the next intake",
      body: "This is not a get-rich pitch. It is a structured path for traders who want live context, risk awareness, and a clear next step. The next screen is a short video — then a few questions.",
      ctaLabel: "Show me the brief",
    },
    offerVariantId: "ad1",
    socialProofTicker: [
      "Applications are reviewed in order",
      "Free channel access after you complete the short form",
    ],
  },
  ad3: {
    theme: "emerald",
    positioningGate: {
      headline: "Built for action — not endless scrolling.",
      subcopy:
        "Below is a tight summary of what we do. If it resonates, continue to the application.",
      ctaLabel: "Continue",
    },
    socialProofTicker: [
      "Join the free signals channel after you qualify",
      "Structured approach — no guaranteed income claims",
    ],
    offer: {
      mode: "lp",
      heroTitle: "GTMO Trading — live context, clear structure",
      heroSub:
        "We share live trade context in our free channel. Serious members can go deeper with guided next steps.",
      bullets: [
        "Daily market context and setups (education, not financial advice)",
        "Risk-aware framing — we talk about what can go wrong",
        "One path: apply → short questionnaire → right-fit routing",
      ],
      ctaLabel: "Start application",
    },
  },
  ad4: ad4VariantConfig,
};
