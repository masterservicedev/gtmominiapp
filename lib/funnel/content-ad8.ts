import type { FunnelVariantConfig } from "./types";
import { funnelPaletteAmber } from "./palette";

export const ad8VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteAmber,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "$18,000 made live. You were not in position for it. Here is how to change that.",
    subcopy: [
      "What you are about to watch is a real live session — $18,000 secured, positions and charts visible throughout. This is what being inside the environment looks like. Every person who follows GTMO had a first session they watched from the outside.",
      "After the video, a short questionnaire matches you to the right access level for your capital and experience. Some will qualify for VIP signal access. Others will be matched to a structured education path that gets them there. Both get you inside.",
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
