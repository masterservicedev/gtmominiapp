import type { AdVariant } from "./normalize";

export type FunnelTheme = "emerald" | "amber";

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
  /** Brand mark in header (public path), e.g. `/logo-goldtradermo.png` */
  headerLogoSrc?: string;
  primaryCtaLabel: string;
  video: VideoOfferConfig;
  /** Hero above video — three stacked lines (e.g. stats + positioning). */
  intro: {
    h1: string;
    h2: string;
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
  vacationsTitle: string;
  testimonialsSectionTitle: string;
  testimonials: CodeLandingTestimonial[];
  moSection: {
    title: string;
    subtitleLines: string[];
    bodyParagraphs: string[];
    imageFile: string;
    signImageFile: string;
    signOffLines: string[];
  };
  footerLinks: { label: string; href: string }[];
  /** Plain text paragraphs; **bold** segments rendered in <strong> */
  disclaimerParagraphs: string[];
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
  | CodeLandingOfferBlock;

export type PositioningGateCopy = {
  headline: string;
  subcopy?: string;
  ctaLabel: string;
  /** Public path under `/public`, e.g. `/logo-goldtradermo.png` */
  logoSrc?: string;
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
