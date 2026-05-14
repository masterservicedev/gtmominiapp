import type { FunnelVariantConfig } from "./types";
import { funnelPaletteVioletSky } from "./palette";

export const ad5VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteVioletSky,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "Attention — if you want gold context with structure, read this before you tap through.",
    subcopy: [
      "This path is for people who prefer a clear process over noise: a short on-page brief, then a questionnaire inside the app.",
      "We review applications in rounds. When a round is full, the next window may be later — that is a real operational limit, not a theatrical timer.",
      "Nothing here is a promise of profit, accuracy, or passive income. It is education, live framing, and honest risk language only.",
    ].join("\n\n"),
    ctaLabel: "Continue to the brief",
  },
  socialProofTicker: [
    "Applications are reviewed in order — the questionnaire is short and routes you cleanly",
    "Gold-focused context: how setups are discussed, how risk is named, what “live” actually means here",
    "Not financial advice — no robot claims, no celebrity endorsements, no fake market tickers",
  ],
  offer: {
    mode: "funnel_template",
  },
};
