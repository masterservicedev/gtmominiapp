import type { AdVariant } from "./normalize";

export type FunnelTheme = "emerald" | "amber";

export type VideoOfferConfig = {
  src: string;
  poster?: string;
  minWatchSeconds: number;
};

export type OfferBlock =
  | {
      mode: "video";
      ctaLabel: string;
      heroTitle: string;
      heroSub?: string;
      video: VideoOfferConfig;
      authority?: {
        title: string;
        body: string[];
        imageUrl?: string;
      };
      supportingCopy?: string[];
      riskShort?: string;
      riskLinkUrl?: string;
    }
  | {
      mode: "lp";
      ctaLabel: string;
      heroTitle: string;
      heroSub?: string;
      bullets: string[];
      imageUrl?: string;
    };

export type PositioningGateCopy = {
  headline: string;
  subcopy?: string;
  ctaLabel: string;
};

export type PrelanderCopy = {
  headline: string;
  body: string;
  ctaLabel: string;
};

export type FunnelVariantConfig = {
  positioningGate: PositioningGateCopy;
  /** ad2 only */
  prelander?: PrelanderCopy;
  /** ad2: reuse ad1 offer creative */
  offerVariantId?: AdVariant;
  offer?: OfferBlock;
  socialProofTicker?: string[];
  theme?: FunnelTheme;
};
