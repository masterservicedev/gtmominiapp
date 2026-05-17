"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import {
  MarketingAuthorityCardSectionView,
  MarketingCtaSectionView,
  MarketingFaqSectionView,
  MarketingHeroSectionView,
  MarketingHowItWorksSectionView,
  MarketingStatsSectionView,
  MarketingTestimonialsSliderSectionView,
  MarketingUrgencySectionView,
  MarketingWhySectionView,
} from "@/components/funnel/sections";
import {
  CorpFaqSectionView,
  CorpFinalCtaSectionView,
  CorpHeaderSectionView,
  CorpHeroStartSectionView,
  CorpHowBandSectionView,
  CorpPathStepsSectionView,
  CorpReviewsSectionView,
  CorpSplitWorkSectionView,
  CorpThreeCardsSectionView,
  CorpTopicCardsSectionView,
  CorpValueTilesSectionView,
  CorpVideoRowSectionView,
} from "@/components/funnel/corp-funnel-sections";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { VideoOffer } from "@/components/funnel/VideoOffer";
import type { AdVariant } from "@/lib/funnel/normalize";
import {
  funnelThemeToCssVars,
  type AuthoritySection,
  type FunnelConfig,
  type FunnelSection,
  type FooterSection,
  type HeroSplitSection,
  type JoinSection,
  type TestimonialsSection,
  type UrgencyBandSection,
  type VacationsSection,
} from "@/lib/funnel/framework";
import type { FunnelAccentPalette } from "@/lib/funnel/types";
import { trackFunnelEvent } from "@/lib/funnel/track";

const MEDIA_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_GTMO_CODE_MEDIA_BASE || "").replace(/\/$/, "")
    : "";

function mediaUrl(file: string) {
  if (!MEDIA_BASE) return null;
  return `${MEDIA_BASE}/${file.replace(/^\//, "")}`;
}

function resolveMediaSrc(path: string | undefined): string | null {
  if (!path?.trim()) return null;
  const p = path.trim();
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return mediaUrl(p);
}

function fillProject(s: string, projectName: string) {
  return s.replace(/\{projectName\}/g, projectName);
}

function RichLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} style={{ fontWeight: 600, color: "var(--funnel-heading)" }}>
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

const FOMO_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Canada",
  "Australia",
];
const FOMO_TIMES = ["2 min", "5 min", "8 min", "12 min", "15 min"];

type Props = {
  config: FunnelConfig;
  variant: AdVariant;
  palette: FunnelAccentPalette;
  progressCurrent: number;
  progressTotal: number;
};

export function FunnelRenderer({
  config,
  variant,
  palette,
  progressCurrent,
  progressTotal,
}: Props) {
  const router = useRouter();
  const { projectName, theme, primaryCtaLabel, sections } = config;

  const [ctaBusy, setCtaBusy] = useState(false);
  const [fomoCountry, setFomoCountry] = useState("United States");
  const [fomoTime, setFomoTime] = useState("2 min");
  const [spots, setSpots] = useState(7);
  const [showActivity, setShowActivity] = useState(false);
  const [showSpots, setShowSpots] = useState(false);
  const [activityPulse, setActivityPulse] = useState(false);
  const [spotsShake, setSpotsShake] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);
  const testimonialsScrollRef = useRef<HTMLUListElement>(null);
  const testimonialsPausedRef = useRef(false);
  const testimonialsTouchResumeRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const t1 = setTimeout(() => setShowActivity(true), 2000);
    const t2 = setTimeout(() => setShowSpots(true), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const tickActivity = useCallback(() => {
    setFomoCountry(FOMO_COUNTRIES[Math.floor(Math.random() * FOMO_COUNTRIES.length)]!);
    setFomoTime(FOMO_TIMES[Math.floor(Math.random() * FOMO_TIMES.length)]!);
    setActivityPulse(true);
    setTimeout(() => setActivityPulse(false), 600);
  }, []);

  const tickSpots = useCallback(() => {
    setSpots((s) => {
      let n = s;
      if (n > 3) n -= Math.floor(Math.random() * 2) + 1;
      if (n < 3) n = 3;
      return n;
    });
    setSpotsShake(true);
    setTimeout(() => setSpotsShake(false), 500);
  }, []);

  useEffect(() => {
    const i1 = setInterval(tickActivity, 22_000);
    const i2 = setInterval(tickSpots, 30_000);
    const o1 = setTimeout(tickActivity, 8_000);
    const o2 = setTimeout(tickSpots, 12_000);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
      clearTimeout(o1);
      clearTimeout(o2);
    };
  }, [tickActivity, tickSpots]);

  useEffect(() => {
    if (!showActivity) return;
    tickActivity();
  }, [showActivity, tickActivity]);

  useEffect(() => {
    if (!showSpots) return;
    tickSpots();
  }, [showSpots, tickSpots]);

  const scrollListLen = useMemo(() => {
    let max = 0;
    for (const s of sections) {
      if (s.type === "testimonials") max = Math.max(max, s.items.length);
      if (s.type === "corp_reviews") max = Math.max(max, s.items.length);
    }
    return max;
  }, [sections]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (scrollListLen < 2) return;

    const el = testimonialsScrollRef.current;
    if (!el) return;

    let cancelled = false;
    let last = performance.now();
    const pxPerSec = 28;

    const step = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!testimonialsPausedRef.current && el.scrollWidth > el.clientWidth) {
        const max = el.scrollWidth - el.clientWidth;
        el.scrollLeft += pxPerSec * dt;
        if (el.scrollLeft >= max - 0.5) {
          el.scrollLeft = 0;
        }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return () => {
      cancelled = true;
      if (testimonialsTouchResumeRef.current) {
        clearTimeout(testimonialsTouchResumeRef.current);
        testimonialsTouchResumeRef.current = null;
      }
    };
  }, [scrollListLen]);

  const continueToQualify = useCallback(async () => {
    setCtaBusy(true);
    try {
      await trackFunnelEvent("offer_complete", {
        variant,
        surface: "funnel_template_cta",
      });
      router.push(`/qualify?variant=${encodeURIComponent(variant)}`);
    } finally {
      setCtaBusy(false);
    }
  }, [router, variant]);

  const cssVars = funnelThemeToCssVars(theme);

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        ...cssVars,
        backgroundColor: "var(--funnel-page-bg)",
        color: "var(--funnel-page-text)",
        fontFamily: "var(--funnel-body-font)",
      }}
    >
      <header
        className="border-b"
        style={{
          borderColor: "var(--funnel-surface-border)",
          backgroundColor: "var(--funnel-surface-bg)",
        }}
      >
        <FunnelProgress
          current={progressCurrent}
          total={progressTotal}
          label={undefined}
          palette={palette}
          surface="onLight"
        />
      </header>

      {sections.map((section, idx) => (
        <FunnelSectionView
          key={`${section.type}-${idx}`}
          section={section}
          variant={variant}
          projectName={projectName}
          palette={palette}
          testimonialsScrollRef={testimonialsScrollRef}
          testimonialsPausedRef={testimonialsPausedRef}
          testimonialsTouchResumeRef={testimonialsTouchResumeRef}
          progressBarColor={theme.accentBg}
          onFunnelCta={continueToQualify}
        />
      ))}

      <div
        className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] left-3 right-3 z-40 flex flex-col items-center gap-1 md:bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:flex-row md:justify-center md:gap-2"
        aria-hidden
      >
        {showActivity ? (
          <div
            className={`flex w-full max-w-sm items-center justify-center gap-1.5 rounded-md border border-zinc-700/90 bg-zinc-950/95 px-2.5 py-1 text-center text-[10px] leading-snug text-zinc-100 shadow-md backdrop-blur-sm md:max-w-[17rem] ${
              activityPulse ? `ring-1 ${palette.fomoActivityRing}` : ""
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${palette.livePingOuter} opacity-60 motion-reduce:animate-none`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${palette.liveDot} ${palette.liveDotShadow}`}
              />
            </span>
            <span className="min-w-0 text-center text-zinc-200">
              <span className={`font-semibold ${palette.liveLabel}`}>Live</span>
              {" - User from "}
              <span className="text-zinc-100">{fomoCountry}</span>
              {" joined "}
              <span className="text-zinc-300">{fomoTime}</span>
              {" ago"}
            </span>
          </div>
        ) : null}
        {showSpots ? (
          <div
            className={`w-full max-w-sm rounded-md border border-zinc-700/90 bg-zinc-950/95 px-2.5 py-1 text-center text-[10px] leading-tight text-zinc-100 shadow-md backdrop-blur-sm md:max-w-[12rem] md:text-right ${
              spots <= 5 ? palette.fomoSpotsLowBorder : ""
            } ${spotsShake ? "md:translate-x-0.5" : ""}`}
          >
            <span className={`font-semibold ${palette.fomoSpotsAccent}`}>
              {spots}
            </span>
            <span className="text-zinc-300"> spots open</span>
            <span className="text-zinc-500"> · </span>
            <span className="text-zinc-400">limited intake</span>
          </div>
        ) : null}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:py-4"
        style={{
          borderColor: "var(--funnel-sticky-border)",
          backgroundColor: "var(--funnel-sticky-bg)",
        }}
      >
        <div className="mx-auto flex max-w-lg flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p
            className="hidden text-center text-xs sm:block sm:text-left"
            style={{ color: "var(--funnel-muted)" }}
          >
            Next step: short questionnaire in this app.
          </p>
          <button
            type="button"
            onClick={continueToQualify}
            disabled={ctaBusy}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            className="min-h-[48px] w-full rounded-lg py-3 text-sm font-semibold transition-colors disabled:opacity-60 sm:w-auto sm:min-w-[200px] sm:px-8"
            style={{
              backgroundColor: ctaHover ? theme.accentBgHover : theme.accentBg,
              color: theme.accentFg,
            }}
          >
            {ctaBusy ? "…" : primaryCtaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FunnelSectionView({
  section,
  variant,
  projectName,
  palette,
  testimonialsScrollRef,
  testimonialsPausedRef,
  testimonialsTouchResumeRef,
  progressBarColor,
  onFunnelCta,
}: {
  section: FunnelSection;
  variant: AdVariant;
  projectName: string;
  palette: FunnelAccentPalette;
  testimonialsScrollRef: RefObject<HTMLUListElement | null>;
  testimonialsPausedRef: MutableRefObject<boolean>;
  testimonialsTouchResumeRef: MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  progressBarColor: string;
  onFunnelCta: () => void;
}) {
  switch (section.type) {
    case "hero":
      return (
        <MarketingHeroSectionView section={section} projectName={projectName} />
      );
    case "stats":
      return <MarketingStatsSectionView section={section} />;
    case "why":
      return (
        <MarketingWhySectionView section={section} projectName={projectName} />
      );
    case "how_it_works":
      return (
        <MarketingHowItWorksSectionView section={section} projectName={projectName} />
      );
    case "urgency":
      return <MarketingUrgencySectionView section={section} />;
    case "testimonials_slider":
      return (
        <MarketingTestimonialsSliderSectionView section={section} projectName={projectName} />
      );
    case "authority_card":
      return <MarketingAuthorityCardSectionView section={section} projectName={projectName} />;
    case "faq":
      return <MarketingFaqSectionView section={section} projectName={projectName} />;
    case "cta":
      return (
        <MarketingCtaSectionView section={section} projectName={projectName} />
      );
    case "hero_split":
      return (
        <HeroSplitView
          section={section}
          variant={variant}
          palette={palette}
          progressBarColor={progressBarColor}
        />
      );
    case "join":
      return <JoinView section={section} projectName={projectName} />;
    case "urgency_band":
      return <UrgencyBandView section={section} />;
    case "vacations":
      return <VacationsView section={section} />;
    case "testimonials":
      return (
        <TestimonialsView
          section={section}
          projectName={projectName}
          scrollRef={testimonialsScrollRef}
          pausedRef={testimonialsPausedRef}
          touchResumeRef={testimonialsTouchResumeRef}
        />
      );
    case "authority":
      return <AuthorityView section={section} />;
    case "footer":
      return <FooterView section={section} />;
    case "corp_header":
      return <CorpHeaderSectionView section={section} />;
    case "corp_video_row":
      return (
        <CorpVideoRowSectionView
          section={section}
          variant={variant}
          palette={palette}
          progressBarColor={progressBarColor}
        />
      );
    case "corp_hero_start":
      return <CorpHeroStartSectionView section={section} projectName={projectName} />;
    case "corp_topic_cards":
      return <CorpTopicCardsSectionView section={section} projectName={projectName} />;
    case "corp_value_tiles":
      return <CorpValueTilesSectionView section={section} projectName={projectName} />;
    case "corp_path_steps":
      return <CorpPathStepsSectionView section={section} projectName={projectName} />;
    case "corp_reviews":
      return (
        <CorpReviewsSectionView
          section={section}
          projectName={projectName}
          scrollRef={testimonialsScrollRef}
          pausedRef={testimonialsPausedRef}
          touchResumeRef={testimonialsTouchResumeRef}
        />
      );
    case "corp_how_band":
      return <CorpHowBandSectionView section={section} projectName={projectName} />;
    case "corp_split_work":
      return <CorpSplitWorkSectionView section={section} projectName={projectName} />;
    case "corp_three_cards":
      return <CorpThreeCardsSectionView section={section} projectName={projectName} />;
    case "corp_faq":
      return <CorpFaqSectionView section={section} projectName={projectName} />;
    case "corp_final_cta":
      return <CorpFinalCtaSectionView section={section} projectName={projectName} />;
    default:
      return null;
  }
}

function HeroSplitView({
  section,
  variant,
  palette,
  progressBarColor,
}: {
  section: HeroSplitSection;
  variant: AdVariant;
  palette: FunnelAccentPalette;
  progressBarColor: string;
}) {
  const { video, intro, urgencyAside } = section;
  return (
    <section
      className="border-b"
      style={{
        borderColor: "var(--funnel-surface-border)",
        backgroundColor: "var(--funnel-surface-bg)",
      }}
    >
      <div
        className="mx-auto w-full px-4 pb-5 pt-3 md:py-8 lg:pb-10 lg:pt-8"
        style={{
          maxWidth: "var(--funnel-max-width)",
          paddingTop: "var(--funnel-hero-pad-y)",
        }}
      >
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-8">
          <div className="col-span-12 flex flex-col gap-2 lg:col-span-7 lg:gap-3">
            <VideoOffer
              src={video.src}
              poster={video.poster}
              minWatchSeconds={video.minWatchSeconds}
              palette={palette}
              progressBarColor={progressBarColor}
              onThresholdMet={(seconds) =>
                trackFunnelEvent("offer_watched", {
                  variant,
                  seconds_watched: seconds,
                })
              }
            />
            <div
              className="rounded-lg border px-3 py-2.5 text-center shadow-sm ring-1 ring-black/[0.04] lg:text-left"
              style={{
                borderColor: "var(--funnel-card-border)",
                backgroundColor: "var(--funnel-card-bg)",
              }}
            >
              <p
                className="text-[13px] font-normal leading-snug tracking-tight sm:text-sm md:text-lg md:leading-snug"
                style={{
                  fontFamily: "var(--funnel-heading-font)",
                  color: "var(--funnel-heading)",
                }}
              >
                {intro.h1}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold leading-snug sm:text-xs md:text-base">
                {intro.h2}
              </p>
              {intro.h2b ? (
                <p
                  className="mt-0.5 text-[11px] font-semibold leading-snug sm:text-xs md:text-base"
                  style={{ color: "var(--funnel-accent-on-light)" }}
                >
                  {intro.h2b}
                </p>
              ) : null}
              <p
                className="mt-1.5 text-[10px] leading-snug sm:text-[11px] md:text-sm md:leading-relaxed"
                style={{ color: "var(--funnel-muted)" }}
              >
                {intro.h3}
              </p>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <div
              className="flex h-full flex-col rounded-xl border p-4 shadow-sm ring-1 ring-black/5 md:p-6"
              style={{
                borderColor: "var(--funnel-card-border)",
                backgroundColor: "var(--funnel-card-bg)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--funnel-muted)" }}
              >
                {urgencyAside.eyebrow}
              </p>
              <h2
                className="mt-2 text-lg font-normal leading-snug md:mt-3 md:text-2xl"
                style={{
                  fontFamily: "var(--funnel-heading-font)",
                  color: "var(--funnel-heading)",
                }}
              >
                {urgencyAside.headline}
              </h2>
              <ul
                className="mt-4 flex-1 space-y-2.5 text-xs leading-relaxed md:mt-5 md:space-y-3 md:text-sm"
                style={{ color: "var(--funnel-muted)" }}
              >
                {urgencyAside.bullets.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span
                      className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full md:mt-1.5"
                      style={{ backgroundColor: "var(--funnel-accent)" }}
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p
                className="mt-4 text-center text-[10px] leading-relaxed md:mt-6 md:text-xs"
                style={{ color: "var(--funnel-muted)" }}
              >
                Trading can result in loss of capital. Continue when ready using the bar at the bottom.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function JoinView({ section, projectName }: { section: JoinSection; projectName: string }) {
  return (
    <section
      className="border-b py-12 md:py-14"
      style={{
        borderColor: "var(--funnel-surface-border)",
        backgroundColor: "var(--funnel-page-bg)",
        paddingTop: "var(--funnel-section-pad-y)",
        paddingBottom: "var(--funnel-section-pad-y)",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2
          className="mb-6 text-2xl font-normal tracking-tight md:text-3xl"
          style={{
            fontFamily: "var(--funnel-heading-font)",
            color: "var(--funnel-heading)",
          }}
        >
          {fillProject(section.headline, projectName)}
        </h2>
        <div
          className="space-y-4 text-left text-base font-normal leading-relaxed"
          style={{ color: "var(--funnel-muted)" }}
        >
          {section.paragraphs.map((p) => (
            <p key={p}>
              <RichLine text={fillProject(p, projectName)} />
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function UrgencyBandView({ section }: { section: UrgencyBandSection }) {
  return (
    <section
      className="border-b py-12 text-white shadow-inner md:py-14"
      style={{
        borderColor: "var(--funnel-surface-border)",
        background: `linear-gradient(to bottom, var(--funnel-band-from), var(--funnel-band-via), var(--funnel-band-to))`,
        paddingTop: "var(--funnel-section-pad-y)",
        paddingBottom: "var(--funnel-section-pad-y)",
      }}
    >
      <div className="mx-auto max-w-3xl px-4">
        <h2
          className="text-center text-2xl font-normal tracking-tight md:text-3xl"
          style={{ fontFamily: "var(--funnel-heading-font)", color: "var(--funnel-band-text)" }}
        >
          {section.title}
        </h2>
        {section.subtitle ? (
          <p
            className="mt-4 text-center text-sm leading-relaxed"
            style={{ color: "var(--funnel-band-muted)" }}
          >
            {section.subtitle}
          </p>
        ) : null}
        <ul className="mt-8 space-y-3 text-left text-sm leading-relaxed text-zinc-200">
          {section.bullets.map((b) => (
            <li
              key={b}
              className="flex gap-3 rounded-xl border px-4 py-3.5 backdrop-blur-sm"
              style={{ borderColor: "var(--funnel-band-bullet-border)", backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: "var(--funnel-accent)" }}
                aria-hidden
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function VacationsView({ section }: { section: VacationsSection }) {
  if (!section.title?.trim()) return null;
  return (
    <section
      className="border-b py-10 md:py-12"
      style={{
        borderColor: "var(--funnel-surface-border)",
        backgroundColor: "var(--funnel-surface-bg)",
      }}
    >
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2
          className="text-2xl font-normal tracking-tight md:text-3xl"
          style={{
            fontFamily: "var(--funnel-heading-font)",
            color: "var(--funnel-heading)",
          }}
        >
          {section.title}
        </h2>
      </div>
    </section>
  );
}

function TestimonialsView({
  section,
  projectName,
  scrollRef,
  pausedRef,
  touchResumeRef,
}: {
  section: TestimonialsSection;
  projectName: string;
  scrollRef: RefObject<HTMLUListElement | null>;
  pausedRef: MutableRefObject<boolean>;
  touchResumeRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}) {
  return (
    <section
      className="border-b py-8 md:py-14"
      style={{
        borderColor: "var(--funnel-surface-border)",
        backgroundColor: "var(--funnel-page-bg)",
      }}
    >
      <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--funnel-max-width)" }}>
        <h2
          className="mb-5 text-center text-2xl font-normal tracking-tight md:mb-8 md:text-3xl"
          style={{
            fontFamily: "var(--funnel-heading-font)",
            color: "var(--funnel-heading)",
          }}
        >
          {section.sectionTitle}
        </h2>
        <div
          className="-mx-4 px-4 md:mx-0 md:px-0"
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
          onTouchStart={() => {
            pausedRef.current = true;
            if (touchResumeRef.current) {
              clearTimeout(touchResumeRef.current);
              touchResumeRef.current = null;
            }
          }}
          onTouchEnd={() => {
            if (touchResumeRef.current) {
              clearTimeout(touchResumeRef.current);
            }
            touchResumeRef.current = setTimeout(() => {
              pausedRef.current = false;
              touchResumeRef.current = null;
            }, 2500);
          }}
        >
          <ul
            ref={scrollRef as RefObject<HTMLUListElement>}
            className="flex items-start gap-2.5 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-3 md:pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {section.items.map((item) => (
              <li
                key={item.name}
                className="flex min-w-[min(78vw,15.5rem)] max-w-[15.5rem] shrink-0 gap-2 rounded-lg border px-2.5 py-2 shadow-sm sm:min-w-[15rem] md:max-w-[16.25rem] md:gap-2.5 md:rounded-xl md:px-3 md:py-2.5"
                style={{
                  borderColor: "var(--funnel-card-border)",
                  backgroundColor: "var(--funnel-surface-bg)",
                }}
              >
                <TestimonialAvatar name={item.name} imageFile={item.imageFile} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div
                    className="shrink-0 text-[11px] font-semibold leading-tight md:text-xs"
                    style={{ color: "var(--funnel-heading)" }}
                  >
                    {item.name}
                  </div>
                  <p className="mt-0.5 line-clamp-4 text-[11px] leading-snug md:line-clamp-5 md:text-xs md:leading-relaxed">
                    <RichLine text={fillProject(item.quote, projectName)} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AuthorityView({ section }: { section: AuthoritySection }) {
  return (
    <section
      className="border-b py-12 md:py-14"
      style={{
        borderColor: "var(--funnel-surface-border)",
        backgroundColor: "var(--funnel-surface-bg)",
      }}
    >
      <div
        className="mx-auto flex w-full flex-col gap-10 px-4 md:flex-row md:items-start"
        style={{ maxWidth: "var(--funnel-max-width)" }}
      >
        <div className="md:w-2/5">
          {resolveMediaSrc(section.imageFile) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaSrc(section.imageFile)!}
              alt="Gold Trader Mo"
              className="w-full rounded-xl border object-cover shadow-sm"
              style={{ borderColor: "var(--funnel-card-border)" }}
            />
          ) : (
            <div
              className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-dashed text-sm"
              style={{
                borderColor: "var(--funnel-card-border)",
                backgroundColor: "var(--funnel-card-bg)",
                color: "var(--funnel-muted)",
              }}
            >
              Photo
            </div>
          )}
        </div>
        <div className="md:flex-1">
          <h2
            className="text-3xl font-normal tracking-tight md:text-4xl"
            style={{
              fontFamily: "var(--funnel-heading-font)",
              color: "var(--funnel-heading)",
            }}
          >
            {section.title}
          </h2>
          <div
            className="mt-3 space-y-0.5 text-lg font-medium leading-snug md:text-xl"
            style={{ color: "var(--funnel-accent-on-light)" }}
          >
            {section.subtitleLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div
            className="mt-6 space-y-4 text-base font-normal leading-relaxed"
            style={{ color: "var(--funnel-muted)" }}
          >
            {section.bodyParagraphs.map((p) => (
              <p key={p}>
                <RichLine text={p} />
              </p>
            ))}
          </div>
          <div
            className="mt-8 flex flex-wrap items-end justify-end gap-4 border-t pt-8"
            style={{ borderColor: "var(--funnel-surface-border)" }}
          >
            {resolveMediaSrc(section.signImageFile) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaSrc(section.signImageFile)!}
                alt=""
                className="max-h-16 object-contain"
              />
            ) : null}
            <div
              className="w-full text-right text-sm"
              style={{ color: "var(--funnel-muted)" }}
            >
              {section.signOffLines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterView({ section }: { section: FooterSection }) {
  const hasLinks = section.footerLinks && section.footerLinks.length > 0;
  const hasDisclaimer =
    section.disclaimerParagraphs && section.disclaimerParagraphs.length > 0;
  if (!hasLinks && !hasDisclaimer) return null;
  return (
    <footer
      className="border-t"
      style={{
        borderColor: "var(--funnel-surface-border)",
        backgroundColor: "var(--funnel-page-bg)",
        color: "var(--funnel-muted)",
      }}
    >
      {hasLinks ? (
        <div
          className="border-t px-4 py-6"
          style={{
            borderColor: "var(--funnel-surface-border)",
            backgroundColor: "var(--funnel-surface-bg)",
          }}
        >
          <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {section.footerLinks!.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="hover:underline underline-offset-4"
                  style={{ color: "var(--funnel-accent-on-light)" }}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hasDisclaimer ? (
        <div className="mx-auto max-w-4xl px-4 pb-10 text-left text-[11px] leading-relaxed">
          {section.disclaimerParagraphs!.map((p, i) => (
            <p key={i} className="mb-2.5">
              <RichLine text={p} />
            </p>
          ))}
        </div>
      ) : null}
    </footer>
  );
}

function TestimonialAvatar({
  name,
  imageFile,
}: {
  name: string;
  imageFile: string;
}) {
  const url = resolveMediaSrc(imageFile);
  const initial = name.charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-zinc-100 md:h-10 md:w-10"
      />
    );
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold md:h-10 md:w-10 md:text-sm"
      style={{
        backgroundColor: "var(--funnel-card-bg)",
        color: "var(--funnel-muted)",
      }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
