import type { CSSProperties } from "react";

/** Flat visual tokens — copy from the source funnel CSS (no preset base themes). */
export type FunnelTheme = {
  pageBg: string;
  pageText: string;
  surfaceBg: string;
  surfaceBorder: string;
  cardBg: string;
  cardBorder: string;
  mutedText: string;
  headingColor: string;
  headingFont: string;
  bodyFont: string;
  accentBg: string;
  accentBgHover: string;
  accentFg: string;
  accentOnLight: string;
  bandFrom: string;
  bandVia: string;
  bandTo: string;
  bandText: string;
  bandMuted: string;
  bandBulletBorder: string;
  stickyBg: string;
  stickyBorder: string;
  maxWidth: string;
  heroPaddingY: string;
  sectionPaddingY: string;
  /** Optional: corporate / split-surface landers (e.g. ad6). */
  corpDarkBg?: string;
  corpDarkText?: string;
  corpDarkMuted?: string;
  corpYellowBg?: string;
  corpYellowText?: string;
  corpNavLink?: string;
  /** Optional: Fortiora / marketing-template CSS vars (all optional — mapper supplies fallbacks). */
  bodyColor?: string;
  overlayBg?: string;
  accentContrast?: string;
  headingWeight?: number;
  headingTransform?: string;
  headingLetterSpacing?: string;
  btnRadius?: string;
  btnPadding?: string;
  btnFontSize?: string;
  btnFontWeight?: number;
  btnTextTransform?: string;
  cardRadius?: string;
  cardPadding?: string;
  cardShadow?: string;
};

export type FunnelTestimonial = {
  name: string;
  /** Use {projectName} for dynamic replacement */
  quote: string;
  imageFile: string;
};

export type HeroSplitSection = {
  type: "hero_split";
  video: { src: string; poster?: string; minWatchSeconds: number };
  intro: { h1: string; h2: string; h2b?: string; h3: string };
  urgencyAside: { eyebrow: string; headline: string; bullets: string[] };
};

export type JoinSection = {
  type: "join";
  headline: string;
  paragraphs: string[];
};

export type UrgencyBandSection = {
  type: "urgency_band";
  title: string;
  subtitle?: string;
  bullets: string[];
};

export type VacationsSection = {
  type: "vacations";
  title: string;
};

export type TestimonialsSection = {
  type: "testimonials";
  sectionTitle: string;
  items: FunnelTestimonial[];
};

export type AuthoritySection = {
  type: "authority";
  title: string;
  subtitleLines: string[];
  bodyParagraphs: string[];
  imageFile: string;
  signImageFile?: string;
  signOffLines: string[];
};

export type FooterSection = {
  type: "footer";
  footerLinks?: { label: string; href: string }[];
  disclaimerParagraphs?: string[];
};

export type CorpHeaderSection = {
  type: "corp_header";
  advertorialLine: string;
  navLinks: { label: string; href: string }[];
  logoSrc?: string;
};

export type CorpVideoRowSection = {
  type: "corp_video_row";
  video: { src: string; poster?: string; minWatchSeconds: number };
  caption?: string;
};

export type CorpHeroStartSection = {
  type: "corp_hero_start";
  headline: string;
  headlineItalic?: string;
  paragraphs: string[];
  heroImageFile?: string;
};

export type CorpTopicCardsSection = {
  type: "corp_topic_cards";
  title: string;
  titleItalic?: string;
  intro?: string;
  cards: { eyebrow: string; body: string }[];
};

export type CorpValueTilesSection = {
  type: "corp_value_tiles";
  title: string;
  titleItalic?: string;
  introParagraphs: string[];
  tilesLabel?: string;
  tiles: { imageFile: string; title: string }[];
  bottomLine?: string;
};

export type CorpPathStepsSection = {
  type: "corp_path_steps";
  title: string;
  titleItalic?: string;
  introParagraphs: string[];
  pathLeadIn?: string;
  steps: { num: string; title: string }[];
};

export type CorpReviewItem = {
  name: string;
  role: string;
  imageFile: string;
  quote: string;
};

export type CorpReviewsSection = {
  type: "corp_reviews";
  title: string;
  titleItalic?: string;
  introParagraphs: string[];
  items: CorpReviewItem[];
};

export type CorpHowBandSection = {
  type: "corp_how_band";
  title: string;
  titleItalic?: string;
  intro?: string;
  steps: { kicker: string; body: string }[];
};

export type CorpSplitWorkSection = {
  type: "corp_split_work";
  title: string;
  titleItalic?: string;
  h3: string;
  bullets: string[];
  imageFile: string;
};

export type CorpThreeCardsSection = {
  type: "corp_three_cards";
  title: string;
  titleItalic?: string;
  cards: { imageFile: string; title: string; body: string }[];
};

export type CorpFaqSection = {
  type: "corp_faq";
  title: string;
  items: { question: string; answer: string }[];
};

export type CorpFinalCtaSection = {
  type: "corp_final_cta";
  title: string;
  titleItalic?: string;
  paragraphs: string[];
};

/** Marketing template sections (CSS-var driven) — used by ad6; do not merge with legacy `testimonials`. */
export type MarketingHeroSection = {
  type: "hero";
  headline: string;
  subheadline?: string;
  video: { src: string; poster?: string; minWatchSeconds: number };
  /** Shown only while video watch gate is active; sticky bar handles the main CTA. */
  ctaLabel?: string;
  videoAspectRatio?: string; // e.g. "4/5" for portrait, defaults to "16/9"
};

export type MarketingStatsSection = {
  type: "stats";
  items: { value: string; label: string }[];
};

export type MarketingWhySection = {
  type: "why";
  headline: string;
  subheadline?: string;
  body: string[];
  image?: { src: string; alt: string };
  ctaLabel?: string;
};

export type MarketingHowItWorksSection = {
  type: "how_it_works";
  headline: string;
  steps: { number: number; title: string; body: string }[];
  ctaLabel?: string;
};

export type MarketingTestimonialsSliderSection = {
  type: "testimonials_slider";
  headline?: string;
  layout: "slider";
  items: { name: string; quote: string; imageSrc?: string }[];
};

export type MarketingAuthorityCardSection = {
  type: "authority_card";
  headline: string;
  name: string;
  imageSrc: string;
  body: string[];
  signOff: string[];
};

export type MarketingFaqSection = {
  type: "faq";
  headline?: string;
  items: { question: string; answer: string }[];
};

export type MarketingCtaSection = {
  type: "cta";
  headline: string;
  subheadline?: string;
  /** Optional; action is handled by the sticky footer CTA. */
  ctaLabel?: string;
  disclaimer?: string;
};

export type MarketingUrgencySection = {
  type: "urgency";
  headline: string;
  bullets: string[];
};

export type FunnelSection =
  | HeroSplitSection
  | JoinSection
  | UrgencyBandSection
  | VacationsSection
  | TestimonialsSection
  | AuthoritySection
  | FooterSection
  | CorpHeaderSection
  | CorpVideoRowSection
  | CorpHeroStartSection
  | CorpTopicCardsSection
  | CorpValueTilesSection
  | CorpPathStepsSection
  | CorpReviewsSection
  | CorpHowBandSection
  | CorpSplitWorkSection
  | CorpThreeCardsSection
  | CorpFaqSection
  | CorpFinalCtaSection
  | MarketingHeroSection
  | MarketingStatsSection
  | MarketingWhySection
  | MarketingHowItWorksSection
  | MarketingTestimonialsSliderSection
  | MarketingAuthorityCardSection
  | MarketingFaqSection
  | MarketingCtaSection
  | MarketingUrgencySection;

export type FunnelConfig = {
  id: string;
  name?: string;
  /** Optional provenance label (e.g. source lander name). */
  sourceRef?: string;
  projectName: string;
  primaryCtaLabel: string;
  headerLogoSrc?: string;
  theme: FunnelTheme;
  sections: FunnelSection[];
};

export function funnelThemeToCssVars(theme: FunnelTheme): CSSProperties {
  const body = theme.bodyColor ?? theme.pageText;
  const accentContrast = theme.accentContrast ?? theme.accentFg;
  const hw = theme.headingWeight ?? 600;
  const htf = theme.headingTransform ?? "none";
  const hls = theme.headingLetterSpacing ?? "0";
  const br = theme.btnRadius ?? "8px";
  const bp = theme.btnPadding ?? "16px 32px";
  const bfs = theme.btnFontSize ?? "15px";
  const bfw = theme.btnFontWeight ?? 600;
  const btt = theme.btnTextTransform ?? "none";
  const cr = theme.cardRadius ?? "12px";
  const cp = theme.cardPadding ?? "24px";
  const cs = theme.cardShadow ?? "0 1px 4px rgba(0,0,0,0.08)";
  const overlay = theme.overlayBg ?? "rgba(17,24,39,0.92)";

  const base: CSSProperties = {
    "--funnel-page-bg": theme.pageBg,
    "--funnel-page-text": theme.pageText,
    "--funnel-surface-bg": theme.surfaceBg,
    "--funnel-surface-border": theme.surfaceBorder,
    "--funnel-card-bg": theme.cardBg,
    "--funnel-card-border": theme.cardBorder,
    "--funnel-muted": theme.mutedText,
    "--funnel-heading": theme.headingColor,
    "--funnel-heading-font": theme.headingFont,
    "--funnel-body-font": theme.bodyFont,
    "--funnel-accent": theme.accentBg,
    "--funnel-accent-hover": theme.accentBgHover,
    "--funnel-accent-fg": theme.accentFg,
    "--funnel-accent-on-light": theme.accentOnLight,
    "--funnel-band-from": theme.bandFrom,
    "--funnel-band-via": theme.bandVia,
    "--funnel-band-to": theme.bandTo,
    "--funnel-band-text": theme.bandText,
    "--funnel-band-muted": theme.bandMuted,
    "--funnel-band-bullet-border": theme.bandBulletBorder,
    "--funnel-sticky-bg": theme.stickyBg,
    "--funnel-sticky-border": theme.stickyBorder,
    "--funnel-max-width": theme.maxWidth,
    "--funnel-hero-pad-y": theme.heroPaddingY,
    "--funnel-section-pad-y": theme.sectionPaddingY,
    "--funnel-body": body,
    "--funnel-accent-contrast": accentContrast,
    "--funnel-section-py": theme.sectionPaddingY,
    "--funnel-heading-weight": String(hw),
    "--funnel-heading-transform": htf,
    "--funnel-heading-ls": hls,
    "--funnel-btn-radius": br,
    "--funnel-btn-padding": bp,
    "--funnel-btn-font-size": bfs,
    "--funnel-btn-font-weight": String(bfw),
    "--funnel-btn-transform": btt,
    "--funnel-card-radius": cr,
    "--funnel-card-padding": cp,
    "--funnel-card-shadow": cs,
    "--funnel-overlay-bg": overlay,
  } as CSSProperties;
  return {
    ...base,
    ...(theme.corpDarkBg ? { "--funnel-corp-dark-bg": theme.corpDarkBg } : {}),
    ...(theme.corpDarkText ? { "--funnel-corp-dark-text": theme.corpDarkText } : {}),
    ...(theme.corpDarkMuted ? { "--funnel-corp-dark-muted": theme.corpDarkMuted } : {}),
    ...(theme.corpYellowBg ? { "--funnel-corp-yellow-bg": theme.corpYellowBg } : {}),
    ...(theme.corpYellowText ? { "--funnel-corp-yellow-text": theme.corpYellowText } : {}),
    ...(theme.corpNavLink ? { "--funnel-corp-nav-link": theme.corpNavLink } : {}),
  } as CSSProperties;
}
