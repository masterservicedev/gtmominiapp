import type { FunnelVariantConfig } from "./types";
import { funnelPaletteEmeraldSlate } from "./palette";

export const ad6VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteEmeraldSlate,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "Structured gold context — without the “get rich quick” noise.",
    subcopy: [
      "This variant uses a corporate-style brief: a short video, then scrollable sections that explain how we talk about risk, process, and live framing.",
      "If you continue, you will answer the same in-app questionnaire as other variants. Nothing on this page replaces your own judgment or due diligence.",
      "Trading and leveraged products can lead to partial or total loss of capital. Past examples are not a guarantee of future results.",
    ].join("\n\n"),
    ctaLabel: "Continue to the brief",
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
