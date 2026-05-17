import type { FunnelVariantConfig } from "./types";
import { funnelPaletteVioletSky } from "./palette";

export const ad5VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteVioletSky,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline:
      "The gold market moved $35,000 in a single session. The people inside knew before it opened.",
    subcopy: [
      "What you are about to see is a live gold trading session — every setup called before execution, every position explained in real time. This is the environment a small number of traders have access to.",
      "This intake round is currently open. Applications are reviewed in order. When this round fills, the next one opens at a later date — not the next day.",
    ].join("\n\n"),
    ctaLabel: "Show me the session",
  },
  socialProofTicker: [
    "$35,000 secured in a single live NFP session — positions called before execution",
    "10,000+ members inside the environment — intake is limited and reviewed in rounds",
    "Application takes under two minutes — specialists follow up directly",
  ],
  offer: {
    mode: "funnel_template",
  },
};
