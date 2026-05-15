import type { FunnelVariantConfig } from "./types";
import { funnelPaletteAmber } from "./palette";

export const ad7VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteAmber,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "Our traders secured over $2,000,000 — documented live.",
    subcopy: [
      "This is not a highlight reel. The session was recorded in real time, unedited, with full transparency on entries, exits, and risk management.",
      "What you are about to see is what disciplined execution looks like when the structure is correct. Then you will decide if this environment is right for you.",
      "Trading involves real risk. This result is documented and not a guarantee of what you will achieve.",
    ].join("\n\n"),
    ctaLabel: "Watch the session",
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
