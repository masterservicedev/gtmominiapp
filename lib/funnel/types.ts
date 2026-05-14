import type { AdVariant } from "./normalize";

/** Per-variant Tailwind class bundles — copy “styling from the pasted funnel” here. */
export type FunnelAccentPalette = {
  accentBg: string;
  accentBgHover: string;
  /** Primary filled buttons (gate, questionnaire, etc.) */
  accentButtonText: string;
  accentText: string;
  accentTextOnLight: string;
  accentBorder: string;
  accentRing: string;
  progressFrom: string;
  selectedBg: string;
  primaryButtonShadow: string;
  questionnaireEyebrow: string;
  qualifyOptionSelected: string;
  joinBandMutedText: string;
  joinBulletCardBorder: string;
  fomoActivityRing: string;
  fomoSpotsLowBorder: string;
  fomoSpotsAccent: string;
  livePingOuter: string;
  liveDot: string;
  liveDotShadow: string;
  liveLabel: string;
  pageRadialGlow: string;
  bridgeHeadline: string;
  bridgeSubline: string;
  bridgeCheckmark: string;
  bonusPanelBorder: string;
  bonusPanelBg: string;
  bonusPanelAccent: string;
  bundleLineAccent: string;
  bundleToggleSelected: string;
  bundleDiscountLabel: string;
  processingBackdrop: string;
  processingDot: string;
  valueBridgeEyebrow: string;
};

export type VideoOfferConfig = {
  src: string;
  poster?: string;
  minWatchSeconds: number;
};

export type CodeLandingTestimonial = {
  name: string;
  /** Use {projectName} where the PHP page had .js-project-name */
  quote: string;
  imageFile: string;
};

export type CodeLandingOfferBlock = {
  mode: "code_landing";
  projectName: string;
  /** Brand mark in header (public path), e.g. `/logo-gtmo-crown.png` */
  headerLogoSrc?: string;
  primaryCtaLabel: string;
  video: VideoOfferConfig;
  /** Hero above video — headline plus optional second stat line (e.g. accent). */
  intro: {
    h1: string;
    h2: string;
    h2b?: string;
    h3: string;
  };
  /** Replaces old sidebar lead form — urgency copy + bullets. */
  urgencyAside: {
    eyebrow: string;
    headline: string;
    bullets: string[];
  };
  /** Optional band between join section and vacations. */
  midPageUrgency?: {
    title: string;
    subtitle?: string;
    bullets: string[];
  };
  joinSection: {
    headline: string;
    paragraphs: string[];
  };
  /** Omit or leave empty to hide the vacations heading section. */
  vacationsTitle?: string;
  testimonialsSectionTitle: string;
  testimonials: CodeLandingTestimonial[];
  moSection: {
    title: string;
    subtitleLines: string[];
    bodyParagraphs: string[];
    imageFile: string;
    signImageFile?: string;
    signOffLines: string[];
  };
  /** Omit or leave empty to hide the footer link row. */
  footerLinks?: { label: string; href: string }[];
  /** Plain text paragraphs; **bold** segments rendered in <strong>. Omit or empty to hide. */
  disclaimerParagraphs?: string[];
};

export type FunnelTemplateOfferBlock = {
  mode: "funnel_template";
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
    }
  | CodeLandingOfferBlock
  | FunnelTemplateOfferBlock;

export type PositioningGateCopy = {
  headline: string;
  subcopy?: string;
  ctaLabel: string;
  /** Public path under `/public`, e.g. `/logo-gtmo-crown.png` */
  logoSrc?: string;
};

export type PrelanderCopy = {
  headline: string;
  body: string;
  ctaLabel: string;
};

export type FunnelVariantConfig = {
  positioningGate: PositioningGateCopy;
  prelander?: PrelanderCopy;
  /** When set, resolve offer from another variant (unused for ad4/ad5-only). */
  offerVariantId?: AdVariant;
  offer?: OfferBlock;
  socialProofTicker?: string[];
  accentPalette?: FunnelAccentPalette;
};
