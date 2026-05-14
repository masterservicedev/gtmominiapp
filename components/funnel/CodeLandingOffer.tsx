"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FunnelProgress } from "@/components/funnel/FunnelProgress";
import { VideoOffer } from "@/components/funnel/VideoOffer";
import type { AdVariant } from "@/lib/funnel/normalize";
import type { CodeLandingOfferBlock } from "@/lib/funnel/types";
import type { FunnelTheme } from "@/lib/funnel/types";
import { trackFunnelEvent } from "@/lib/funnel/track";

const MEDIA_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_GTMO_CODE_MEDIA_BASE || "").replace(/\/$/, "")
    : "";

function mediaUrl(file: string) {
  if (!MEDIA_BASE) return null;
  return `${MEDIA_BASE}/${file.replace(/^\//, "")}`;
}

/** `/public` paths, remote URLs, or legacy CDN keys via `NEXT_PUBLIC_GTMO_CODE_MEDIA_BASE`. */
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
            <strong key={i} className="font-semibold text-zinc-900">
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
  offer: CodeLandingOfferBlock;
  variant: AdVariant;
  theme: FunnelTheme;
  progressCurrent: number;
  progressTotal: number;
};

export function CodeLandingOffer({
  offer,
  variant,
  theme,
  progressCurrent,
  progressTotal,
}: Props) {
  const router = useRouter();
  const { projectName } = offer;
  const accentBg = theme === "amber" ? "bg-amber-500" : "bg-emerald-500";
  const accentHover =
    theme === "amber" ? "hover:bg-amber-400" : "hover:bg-emerald-400";
  const accentText = theme === "amber" ? "text-amber-600" : "text-emerald-600";

  const [ctaBusy, setCtaBusy] = useState(false);
  const [fomoCountry, setFomoCountry] = useState("United States");
  const [fomoTime, setFomoTime] = useState("2 min");
  const [spots, setSpots] = useState(7);
  const [showActivity, setShowActivity] = useState(false);
  const [showSpots, setShowSpots] = useState(false);
  const [activityPulse, setActivityPulse] = useState(false);
  const [spotsShake, setSpotsShake] = useState(false);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (offer.testimonials.length < 2) return;

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
  }, [offer.testimonials.length]);

  const continueToQualify = useCallback(async () => {
    setCtaBusy(true);
    try {
      await trackFunnelEvent("offer_complete", {
        variant,
        surface: "code_landing_cta",
      });
      router.push(`/qualify?variant=${encodeURIComponent(variant)}`);
    } finally {
      setCtaBusy(false);
    }
  }, [router, variant]);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 pb-28">
      <header className="border-b border-zinc-200/90 bg-white">
        <FunnelProgress
          current={progressCurrent}
          total={progressTotal}
          label={
            variant === "ad4" || variant === "ad5"
              ? undefined
              : `Step ${progressCurrent} — ${projectName}`
          }
          theme={theme}
          surface="onLight"
        />
      </header>

      <section className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-5 pt-3 md:py-8 lg:pb-10 lg:pt-8">
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-8">
            <div className="col-span-12 flex flex-col gap-2 lg:col-span-7 lg:gap-3">
              <VideoOffer
                src={offer.video.src}
                poster={offer.video.poster}
                minWatchSeconds={offer.video.minWatchSeconds}
                theme={theme}
                onThresholdMet={(seconds) =>
                  trackFunnelEvent("offer_watched", {
                    variant,
                    seconds_watched: seconds,
                  })
                }
              />
              <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/95 px-3 py-2.5 text-center shadow-sm ring-1 ring-zinc-900/[0.04] lg:bg-white/90 lg:text-left">
                <p className="font-serif text-[13px] font-normal leading-snug tracking-tight text-zinc-900 sm:text-sm md:text-lg md:leading-snug">
                  {offer.intro.h1}
                </p>
                <p className="mt-1.5 text-[11px] font-semibold leading-snug text-zinc-900 sm:text-xs md:text-base">
                  {offer.intro.h2}
                </p>
                {offer.intro.h2b ? (
                  <p
                    className={`mt-0.5 text-[11px] font-semibold leading-snug sm:text-xs md:text-base ${accentText}`}
                  >
                    {offer.intro.h2b}
                  </p>
                ) : null}
                <p className="mt-1.5 text-[10px] leading-snug text-zinc-600 sm:text-[11px] md:text-sm md:leading-relaxed">
                  {offer.intro.h3}
                </p>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <div className="flex h-full flex-col rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-4 shadow-sm ring-1 ring-zinc-900/5 md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {offer.urgencyAside.eyebrow}
                </p>
                <h2 className="mt-2 font-serif text-lg font-normal leading-snug text-zinc-900 md:mt-3 md:text-2xl">
                  {offer.urgencyAside.headline}
                </h2>
                <ul className="mt-4 flex-1 space-y-2.5 text-xs leading-relaxed text-zinc-600 md:mt-5 md:space-y-3 md:text-sm">
                  {offer.urgencyAside.bullets.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span
                        className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full md:mt-1.5 ${accentBg}`}
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-center text-[10px] leading-relaxed text-zinc-500 md:mt-6 md:text-xs">
                  Trading can result in loss of capital. Continue when ready using the bar at the bottom.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200/80 bg-[#fafaf9] py-12 md:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 font-serif text-2xl font-normal tracking-tight text-zinc-900 md:text-3xl">
            {fillProject(offer.joinSection.headline, projectName)}
          </h2>
          <div className="space-y-4 text-left text-base font-normal leading-relaxed text-zinc-600">
            {offer.joinSection.paragraphs.map((p) => (
              <p key={p}>
                <RichLine text={fillProject(p, projectName)} />
              </p>
            ))}
          </div>
        </div>
      </section>

      {offer.midPageUrgency ? (
        <section className="border-b border-zinc-800/90 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 py-12 text-white shadow-inner md:py-14">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center font-serif text-2xl font-normal tracking-tight text-white md:text-3xl">
              {offer.midPageUrgency.title}
            </h2>
            {offer.midPageUrgency.subtitle ? (
              <p className="mt-4 text-center text-sm leading-relaxed text-amber-100/85">
                {offer.midPageUrgency.subtitle}
              </p>
            ) : null}
            <ul className="mt-8 space-y-3 text-left text-sm leading-relaxed text-zinc-200">
              {offer.midPageUrgency.bullets.map((b) => (
                <li
                  key={b}
                  className="flex gap-3 rounded-xl border border-amber-500/25 bg-black/30 px-4 py-3.5 backdrop-blur-sm"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accentBg}`}
                    aria-hidden
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {offer.vacationsTitle?.trim() ? (
        <section className="border-b border-zinc-200/80 bg-white py-10 md:py-12">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="font-serif text-2xl font-normal tracking-tight text-zinc-900 md:text-3xl">
              {offer.vacationsTitle}
            </h2>
          </div>
        </section>
      ) : null}

      <section className="border-b border-zinc-200/80 bg-[#fafaf9] py-8 md:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-5 text-center font-serif text-2xl font-normal tracking-tight text-zinc-900 md:mb-8 md:text-3xl">
            {offer.testimonialsSectionTitle}
          </h2>
          <div
            className="-mx-4 px-4 md:mx-0 md:px-0"
            onMouseEnter={() => {
              testimonialsPausedRef.current = true;
            }}
            onMouseLeave={() => {
              testimonialsPausedRef.current = false;
            }}
            onTouchStart={() => {
              testimonialsPausedRef.current = true;
              if (testimonialsTouchResumeRef.current) {
                clearTimeout(testimonialsTouchResumeRef.current);
                testimonialsTouchResumeRef.current = null;
              }
            }}
            onTouchEnd={() => {
              if (testimonialsTouchResumeRef.current) {
                clearTimeout(testimonialsTouchResumeRef.current);
              }
              testimonialsTouchResumeRef.current = setTimeout(() => {
                testimonialsPausedRef.current = false;
                testimonialsTouchResumeRef.current = null;
              }, 2500);
            }}
          >
            <ul
              ref={testimonialsScrollRef}
              className="flex items-start gap-2.5 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-3 md:pb-2 [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {offer.testimonials.map((item) => (
                <li
                  key={item.name}
                  className="flex min-w-[min(78vw,15.5rem)] max-w-[15.5rem] shrink-0 gap-2 rounded-lg border border-zinc-200/80 bg-white px-2.5 py-2 shadow-sm sm:min-w-[15rem] md:max-w-[16.25rem] md:gap-2.5 md:rounded-xl md:px-3 md:py-2.5"
                >
                  <TestimonialAvatar
                    name={item.name}
                    imageFile={item.imageFile}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="shrink-0 text-[11px] font-semibold leading-tight text-zinc-900 md:text-xs">
                      {item.name}
                    </div>
                    <p className="mt-0.5 line-clamp-4 text-[11px] leading-snug text-zinc-600 md:line-clamp-5 md:text-xs md:leading-relaxed">
                      <RichLine
                        text={fillProject(item.quote, projectName)}
                      />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200/80 bg-white py-12 md:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-start">
          <div className="md:w-2/5">
            {resolveMediaSrc(offer.moSection.imageFile) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaSrc(offer.moSection.imageFile)!}
                alt="Gold Trader Mo"
                className="w-full rounded-xl border border-zinc-200/80 object-cover shadow-sm"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
                Photo
              </div>
            )}
          </div>
          <div className="md:flex-1">
            <h2 className="font-serif text-3xl font-normal tracking-tight text-zinc-900 md:text-4xl">
              {offer.moSection.title}
            </h2>
            <div className={`mt-3 space-y-0.5 text-lg font-medium leading-snug md:text-xl ${accentText}`}>
              {offer.moSection.subtitleLines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            <div className="mt-6 space-y-4 text-base font-normal leading-relaxed text-zinc-600">
              {offer.moSection.bodyParagraphs.map((p) => (
                <p key={p}>
                  <RichLine text={p} />
                </p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-end justify-end gap-4 border-t border-zinc-200/80 pt-8">
              {resolveMediaSrc(offer.moSection.signImageFile) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaSrc(offer.moSection.signImageFile)!}
                  alt=""
                  className="max-h-16 object-contain"
                />
              ) : null}
              <div className="w-full text-right text-sm text-zinc-600">
                {offer.moSection.signOffLines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {(offer.footerLinks && offer.footerLinks.length > 0) ||
      (offer.disclaimerParagraphs && offer.disclaimerParagraphs.length > 0) ? (
        <footer className="border-t border-zinc-200/80 bg-[#fafaf9] text-zinc-600">
          {offer.footerLinks && offer.footerLinks.length > 0 ? (
            <div className="border-t border-zinc-200/80 bg-white px-4 py-6">
              <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                {offer.footerLinks.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className={`${accentText} hover:underline underline-offset-4`}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {offer.disclaimerParagraphs && offer.disclaimerParagraphs.length > 0 ? (
            <div className="mx-auto max-w-4xl bg-white px-4 pb-10 text-left text-[11px] leading-relaxed text-zinc-500">
              {offer.disclaimerParagraphs.map((p, i) => (
                <p key={i} className="mb-2.5">
                  <RichLine text={p} />
                </p>
              ))}
            </div>
          ) : null}
        </footer>
      ) : null}

      <div
        className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] left-3 right-3 z-40 flex flex-col items-center gap-1 md:bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:flex-row md:justify-center md:gap-2"
        aria-hidden
      >
        {showActivity ? (
          <div
            className={`flex w-full max-w-sm items-start justify-center gap-1.5 rounded-md border border-zinc-700/90 bg-zinc-950/95 px-2.5 py-1 text-[10px] leading-snug text-zinc-100 shadow-md backdrop-blur-sm md:max-w-[17rem] md:justify-start ${
              activityPulse ? "ring-1 ring-amber-500/40" : ""
            }`}
          >
            <span className="relative mt-0.5 flex h-2 w-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.85)]" />
            </span>
            <span className="min-w-0 flex-1 text-left text-zinc-200">
              <span className="font-semibold text-emerald-400/95">Live</span>
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
              spots <= 5 ? "border-amber-600/70" : ""
            } ${spotsShake ? "md:translate-x-0.5" : ""}`}
          >
            <span className="font-semibold text-amber-400/95">{spots}</span>
            <span className="text-zinc-300"> spots open</span>
            <span className="text-zinc-500"> · </span>
            <span className="text-zinc-400">limited intake</span>
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/80 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:py-4">
        <div className="mx-auto flex max-w-lg flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="hidden text-center text-xs text-zinc-500 sm:block sm:text-left">
            Next step: short questionnaire in this app.
          </p>
          <button
            type="button"
            onClick={continueToQualify}
            disabled={ctaBusy}
            className={`min-h-[48px] w-full rounded-lg py-3 text-sm font-semibold text-zinc-950 transition-colors sm:w-auto sm:min-w-[200px] sm:px-8 ${accentBg} ${accentHover} disabled:opacity-60`}
          >
            {ctaBusy ? "…" : offer.primaryCtaLabel}
          </button>
        </div>
      </div>
    </div>
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 md:h-10 md:w-10 md:text-sm"
      aria-hidden
    >
      {initial}
    </div>
  );
}
