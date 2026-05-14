import type { FunnelVariantConfig } from "./types";
import { funnelPaletteAmber } from "./palette";

export const ad4VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteAmber,
  positioningGate: {
    /** Step 1 gate only — crown / brand mark on the positioning screen. */
    logoSrc: "/offer/media/gtmologo.png",
    headline: "Most traders fail because they're alone.",
    subcopy: [
      "Wrong information. No structure. No one to follow who actually trades.",
      "That changes here. Follow someone who trades live every single day — and builds real positions in real time.",
      "This intake is limited. Serious applicants only.",
    ].join("\n\n"),
    ctaLabel: "Continue",
  },
  socialProofTicker: [
    "Applications reviewed in real time — queue moves quickly",
    "Next step: short questionnaire — takes under two minutes",
    "Education-first — risk-aware framing only",
  ],
  offer: {
    mode: "funnel_template",
  },
};
