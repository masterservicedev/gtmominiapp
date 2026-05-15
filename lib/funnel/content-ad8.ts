import type { FunnelVariantConfig } from "./types";
import { funnelPaletteAmber } from "./palette";

export const ad8VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteAmber,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "He just made $18,000 live. The next trade goes to VIP only.",
    subcopy: [
      "What you are about to watch is a live session recording. $18,000 secured, positions shown on screen, charts visible throughout. Then Mo turns to camera and says the next setup is already prepared — and it goes to VIP members first.",
      "You are watching this because the application is still open. Once the intake round closes, it closes.",
      "Trading involves real risk. This is a documented result, not a guarantee of what you will achieve.",
    ].join("\n\n"),
    ctaLabel: "Watch the session",
  },
  socialProofTicker: [
    "$18,000 secured live — positions and charts shown throughout",
    "Next trade already prepared — goes to VIP members first",
    "Intake round is limited — application closes when spots fill",
  ],
  offer: {
    mode: "funnel_template",
  },
};
