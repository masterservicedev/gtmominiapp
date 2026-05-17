import type { FunnelVariantConfig } from "./types";
import { funnelPaletteAmber } from "./palette";

export const ad10VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteAmber,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "There are two ways to trade gold. One of them makes money. Most people are in the wrong one.",
    subcopy: [
      "The difference is not capital. It is not experience. It is not the market. It is whether you see the setup before the position opens — or after it has already moved.",
      "What follows is an explanation of exactly why that gap exists, and how a small number of people have access to the other side of it.",
    ].join("\n\n"),
    ctaLabel: "Watch and read",
  },
  socialProofTicker: [
    "$2,000,000 cashed out live — full withdrawal documented on camera",
    "Live setups called before execution — not after the move",
    "Limited intake — application required, not everyone is accepted",
  ],
  offer: {
    mode: "funnel_template",
  },
};
