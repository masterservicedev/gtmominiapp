import type { FunnelVariantConfig } from "./types";
import { funnelPaletteEmeraldSlate } from "./palette";

export const ad9VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteEmeraldSlate,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "The one thing separating serious gold traders from everyone else.",
    subcopy: [
      "It is not capital. It is not experience. It is not timing. It is access — to the right setups, called live, before the position opens.",
      "Most people will never get that access. A small number will. Read what follows carefully.",
    ].join("\n\n"),
    ctaLabel: "Continue reading",
  },
  socialProofTicker: [
    "Long-form brief — read in full before applying",
    "Live setups called before execution — not after",
    "Limited intake — serious applicants only",
  ],
  offer: {
    mode: "funnel_template",
  },
};
