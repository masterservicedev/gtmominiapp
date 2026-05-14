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
  | CorpFinalCtaSection;

export type FunnelConfig = {
  id: string;
  name?: string;
  projectName: string;
  primaryCtaLabel: string;
  headerLogoSrc?: string;
  theme: FunnelTheme;
  sections: FunnelSection[];
};

export function funnelThemeToCssVars(theme: FunnelTheme): CSSProperties {
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
