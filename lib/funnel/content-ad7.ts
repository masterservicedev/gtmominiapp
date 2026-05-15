import type { FunnelVariantConfig } from "./types";
import { funnelPaletteAmber } from "./palette";

export const ad7VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteAmber,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "$2,000,000 cashed out — watch the live proof.",
    subcopy: [
      "What you are about to see is a live, unedited withdrawal from a real trading account. No screenshots. No claims. The full amount, withdrawn on camera.",
      "After you watch it, you will understand why access to this environment is limited — and why we only accept serious applicants.",
      "Trading involves real risk. This result is documented evidence, not a promise of what you will achieve.",
    ].join("\n\n"),
    ctaLabel: "Watch the withdrawal",
  },
  socialProofTicker: [
    "Documented live session — unedited, real positions, real exits",
    "Limited intake — not open to everyone, application required",
    "Structure first — no guessing, no random trades inside this environment",
  ],
  offer: {
    mode: "funnel_template",
  },
};
