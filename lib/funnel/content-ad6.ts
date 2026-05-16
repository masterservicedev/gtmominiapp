import type { FunnelVariantConfig } from "./types";
import { funnelPaletteEmeraldSlate } from "./palette";

export const ad6VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteEmeraldSlate,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "You already know the market works. The question is whether your approach to it does.",
    subcopy: [
      "Most traders who lose in gold do not lose because the market is unpredictable. They lose because their process is. No clear entry framework. No discipline on exits. No structure around risk when a position moves against them.",
      "What follows is a brief explanation of how a small number of traders approach this differently — and why the difference in results is not about capital or experience.",
      "Trading involves real risk. Past results are not a guarantee of future returns.",
    ].join("\n\n"),
    ctaLabel: "Show me the difference",
  },
  socialProofTicker: [
    "Education-first layout — video + sections, then the standard questionnaire",
    "No guaranteed returns — illustrative stories only, with risk called out",
    "Applications reviewed in rounds — serious learners only",
  ],
  offer: {
    mode: "funnel_template",
  },
};
